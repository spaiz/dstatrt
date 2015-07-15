"use strict"

var mkfifo = require('mkfifo'),
    monitor = require('./monitor'),
    config = require('./config');

/**
 * Create pipe and use it as data buffer
 */
try {
    mkfifo.mkfifoSync(config.dataBuffer, parseInt("0755", 8));
} catch (err) {
    if (err.code === 17) {
        console.log("Pipe already exists, reusing it...");
    } else {
        throw err;
    }
}

monitor.startMonitor(config);