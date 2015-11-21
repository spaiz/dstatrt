var bouncy = require('bouncy');
var tunnel = require('ngrok');
var debug = require('debug')('zuul:setup');

var user_server = require('./user-server');

// sets up a test instance
// cb(err, instance)
// instance.shutdown() terminates the instance
function setup_test_instance(opt, cb) {

    var support_server = undefined;
    var bouncer = undefined;

    if (opt.server) {
        user_server(opt.server, setup);
    }
    else {
        setup();
    }

    function setup(_support_server) {
        support_server = _support_server;
        var config = opt;
        var control_port = opt.control_port;

        var support_port = undefined;
        if (support_server) {
            support_port = support_server.port;
        }

        // TODO start support server
        // currently happens within user_server

        var bouncer_port = 0;
        if (config.local && parseInt(config.local)) {
            bouncer_port = config.local;
        }

        bouncer = bouncy(function (req, res, bounce) {
            var url = req.url.split('?')[0];
            if (!support_port || url.split('/')[1] === '__zuul') {
                bounce(control_port, { headers: { connection: 'close' }});
                return;
            }

            var opts = {};
            if (req.headers.connection.toLowerCase().indexOf('upgrade') === -1) {
                opts.headers = { connection: 'close' };
            }
            bounce(support_port, opts);
        });

        bouncer.listen(bouncer_port, bouncer_active);

        function bouncer_active() {
            var app_port = bouncer.address().port;
            debug('bouncer active on port %d', app_port);

            if (!config.tunnel) {
                return cb(null, 'http://localhost:' + app_port + '/__zuul');
            }

            tunnel.connect({ port: app_port, authtoken: 'JnawIksKFkXQzrxSjIjQ', proto: 'tcp' }, function(err, url) {
                if (err) {
                    return cb(err);
                }

                cb(null, url.replace('tcp://', 'http://') + '/__zuul');
            });
        }
    }

    function shutdown() {
        bouncer.close();

        tunnel.disconnect();

        if (support_server) {
            support_server.process.kill('SIGKILL');
        }
    }

    return {
        shutdown: shutdown
    };
}

module.exports = setup_test_instance;
