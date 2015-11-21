var config = require('./config'),
    Consumer = require('./consumer').Worker,
    cp = require('child_process');

var child = cp.fork(__dirname + '/app.js', [process.stdin, process.stdout, process.stderr]);

var consumer = new Consumer(config);
consumer.run();