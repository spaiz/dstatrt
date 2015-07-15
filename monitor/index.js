var fs = require('fs'),
    io = require('socket.io'),
    spawn = require('child_process').spawn;

function monitor(config) {
    var dataBuffer = config.dataBuffer || "";
    var port = config.port || "";
    var delay = config.delay || 1;
    var debug = config.debug || false;

    if (!dataBuffer) {
        throw "Must specify data buffer options = {dataBuffer: pipe}";
    }

    if (!port) {
        throw "Must specify port in options = {port: number}";
    }

    if (delay < 1) {
        throw "Delay must be integer >= 1 in options = {delay: number}";
    }

    var server = io.listen(port);

    console.log("Server started. Now you can connect with the client...");

    function log(data, opt) {
        opt = opt || "";
        if (debug) {
            console.log(data, opt);
        }
    }

    var stream = fs.createReadStream(dataBuffer);

    function serverStat(server) {
            var connected = Object.keys(server.engine.clients);
            console.log("Total connected users:", connected.length || "0");
    }

    /**
     * Init our WebSockets, cache, callbacks, and create connections
     */
    function initWebSocket(stream) {
        stream.resume();
        server.sockets.on('connection', function (socket) {
            log("New user connected...");
            serverStat(server);

            /**
             * Data receved from data buffer (pipe) are sent to the client
             * @param data
             */
            function dataReceived(data) {
                /*
                 Print to console data that was received from data buffer,
                 and will be sent to client
                 */
                log(data + "");
                socket.emit("message", {type: 'sampling', data: data + ""});
            }

            /**
             * Server and client are talking wth messages. Client need to ask for "header",
             * and then ask for "sampling" to be able to map data to headers (labels) locally
             */
            socket.on("message", function (msg) {
                switch (msg) {
                    case "header":
                        log("Header request received");
                        socket.emit('message', {type: 'header', data: header});
                        log("Header sent:", header);
                        break;

                    case "sampling":
                        log("Sampling request received. Start sending sampled data...");
                        stream.on("data", dataReceived);
                        break;
                }
            });

            socket.on("disconnect", function () {
                stream.removeListener("data", dataReceived);
                console.log("User disconnected...");
                serverStat(server);
            });
        });
    }

    stream.on("open", function () {
        log("Data buffer (pipe) was successfully opened...");
    });

    var header = null;

    var plugins = config.plugins.concat(['--output', dataBuffer, '--noupdate', delay]);

    log("Plugins enabled", plugins);

    var beginData = [];

    var parseHeader = function (data, plugins) {
        var first = plugins[0].replace('--', '"');

        for (var i = 0; i < beginData.length; i++) {
            var head = beginData[i].indexOf(first);

            if (head === 0) {
                header = beginData[i] + "\n" + beginData[++i];
                break;
            }
        }

        beginData = null;

        return header;
    };

    /**
     * Start listening to dstat data, extract header and cache it.
     * Then start WebSockets, and wait for commands
     */
    stream.on("data", onData);

    /**
     * Read first data received and find header,
     * parse it, cache it.
     * @param data
     */
    function onData(data) {
        log("Data receiving started...");

        beginData = beginData.concat(data.toString().split('\n'));

        if (beginData.length > 10) {
            stream.pause();
            header = parseHeader(beginData, plugins);
            stream.removeListener("data", onData);

            log("Header parsed:", header);

            initWebSocket(stream);
        }
    }

    stream.on('end', function () {
        log("There will be no more data. Stream closed...");
        stream.destroy();
    });

    stream.on('error', function (error) {
        console.log("Stream error. Failed to open pipe:", error);
        stream.destroy();
    });

    var options = { env: config.env };

    options.stdio = debug ? ['inherit', 'inherit', 'inherit'] : ['ignore', 'ignore', 'inherit'];

    var proc = spawn('dstat', plugins, options);

    proc.on('exit', function (code) {
        console.log('Child process (dstat) exited with code ' + code);
        stream.destroy();
    });

    if (debug) {
        /*
        Show in console plain data that dstat sends to stdout
        */
        proc.on('data', function (data) {
            console.log(data + "");
        });
    }
}

module.exports.startMonitor = monitor;