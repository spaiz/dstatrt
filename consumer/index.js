'use strict';
var fs = require('fs'),
    mkfifo = require('mkfifo'),
    io = require('socket.io'),
    eol = require('os').EOL,
    log = require('./../logger/index').log;

const HEADER_MAX_LINES = 15;

class Worker {

    constructor(config) {
        this.config = config;
        this.stream = null;
        this.firstData = [];
        this.header = null;
    }

    createReadStream() {
        try {
            mkfifo.mkfifoSync(this.config.dataBuffer, parseInt("0755", 8));
            console.log("Pipe created at path:", this.config.dataBuffer);
        } catch (err) {
            if (err.code === "EEXIST") {
                console.log("Pipe already exists, reusing it...", this.config.dataBuffer);
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
        this.stream = this.createReadStream();

        this.stream.on('end', function () {
            console.log("There will be no more data. Stream closed...");
        });

        this.stream.on('error', function (error) {
            console.log("Stream error.", error);
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

            server.sockets.emit("sampling", data + "");
        }

        _this.stream.on("data", dataReceived);

        server.sockets.on('connection', function (socket) {
            log("New user connected...");
            _this.serverStat(server);

            /**
             * Server and client are talking wth messages. Client need to ask for "header",
             * and then ask for "sampling" to be able to map data to headers (labels) locally
             */
            socket.on("header", function (msg) {
                log("Header request received");
                socket.emit('header', _this.header);
                log("Header sent:", _this.header);
            });

            socket.on("disconnect", function () {
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

module.exports.Worker = Worker;