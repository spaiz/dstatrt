var fs = require('fs'),
    spawn = require('child_process').spawn,
    config = require('./../config'),
    log = require('./../logger').log;

function monitor(config) {
    var dataBuffer = config.dataBuffer || "";
    var delay = config.delay || 1;
    var debug = config.debug || false;

    if (!dataBuffer) {
        throw "Must specify data buffer options = {dataBuffer: pipe}";
    }

    if (delay < 1) {
        throw "Delay must be integer >= 1 in options = {delay: number}";
    }

    var plugins = config.plugins.concat(['--output', dataBuffer, '--noupdate', delay]);

    log("Plugins enabled", plugins);
    log("Command string", "dstat " + plugins.join(" "));

    var options = {env: config.env};

    options.stdio = debug ? [process.stdin, process.stdout, process.stderr] : ['ignore', 'ignore', process.stderr];

    var proc = spawn('dstat', plugins, options);

    proc.on('error', function (error) {
        console.log('Error when process was spawned', error);
    });

    proc.on('exit', function (code) {
        console.log('Child process (dstat) exited with code', code);
        console.log('Enable debug=true in config.js to see full error report.');
    });

    proc.on('close', function (code, signal) {
        console.log('child process terminated due to receipt of signal ' + signal);
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