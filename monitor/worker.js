'use strict';
var fs = require('fs'),
    config = require('./../config'),
    mkfifo = require('mkfifo'),
    io = require('socket.io'),
    eol = require('os').EOL,
    log = require('./../logger').log;

const HEADER_MAX_LINES = 15;

class Worker {

    constructor(config) {
        this.config = config;
        this.stream = this.createReadStream();
        this.firstData = [];
        this.header = null;
    }

    createReadStream() {
        try {
            mkfifo.mkfifoSync(this.config.dataBuffer, parseInt("0755", 8));
        } catch (err) {
            if (err.code === "EEXIST") {
                console.log("Pipe already exists, reusing it...");
            } else {
                throw err;
            }
        }

        return fs.createReadStream(this.config.dataBuffer);
    }

    /**
     * Read first data received and find header,
     * parse it, cache it.
     * @param data
     */
    onFirstData(data) {
        this.firstData = this.firstData.concat(data.toString().split(eol));

        if (this.firstData.length > HEADER_MAX_LINES) {
            this.pause();
            this.clearListeners();
            this.header = this.parseHeader(this.firstData);

            if (null != this.header) {
                this.startServer();
            }

            console.log("Header parsed:", this.header);
        }
    }

    pause() {
        this.stream.pause();
    }

    clearListeners() {
        this.stream.removeAllListeners("data");
    }

    /**
     * Extract data headers (labels and sub labels) and store in cache
     * @param data
     * @returns {*}
     */
    parseHeader(data) {
        var header;

        data = data.filter(function (item) {
            return item !== "";
        });

        for (var i = 0; i < data.length; i++) {
            var head = data[i].indexOf("\"Cmdline:\",");

            if (head === 0) {
                i += 1;
                header = data[i] + "\n" + data[++i];
                break;
            }
        }

        return header;
    }

    run() {
        this.stream.on('end', function () {
            console.log("There will be no more data. Stream closed...");
        });

        this.stream.on('error', function (error) {
            console.log("Stream error. Failed to open pipe.", error);
        });

        var _this = this;
        /**
         * Start listening to dstat data, extract header and cache it.
         * Then start WebSockets, and wait for commands
         */
        this.stream.on("data", function (data) {
            _this.onFirstData(data);
        });
    }

    startServer() {
        var _this = this;

        var port = this.config.port || "";

        if (!port) {
            throw "Must specify port in options = {port: number}";
        }

        var server = io.listen(port);

        console.log("Server started listening on port %d .... wait for header parsing complete...", port);

        this.stream.resume();

        server.sockets.on('connection', function (socket) {
            log("New user connected...");
            _this.serverStat(server);

            /**
             * Data received from data buffer (pipe) are sent to the client
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
                        socket.emit('message', {type: 'header', data: _this.header});
                        log("Header sent:", _this.header);
                        break;

                    case "sampling":
                        console.log("sampling wanted!!!!!!!!!!!");
                        log("Sampling request received. Start sending sampled data...");
                        _this.stream.on("data", dataReceived);
                        break;
                }
            });

            socket.on("disconnect", function () {
                _this.stream.removeListener("data", dataReceived);
                console.log("User disconnected...");
                _this.serverStat(server);
            });
        });


    }

    serverStat(server) {
        var connected = Object.keys(server.engine.clients);
        console.log("Total connected users:", connected.length || "0");
    }
}

var worker = new Worker(config);
worker.run();

//
///**
// * Read first data received and find header,
// * parse it, cache it.
// * @param data
// */
//function onData(data) {
//    log("Data receiving started...");
//
//    beginData = beginData.concat(data.toString().split('\n'));
//
//    if (beginData.length > 15) {
//        stream.pause();
//        stream.removeListener("data", onData);
//
//        log("Header parsed:", header);
//
//        initWebSocket(stream);
//    }
//}