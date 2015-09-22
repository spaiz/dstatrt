var config = require('./../config');

module.exports.log = function (data, opt) {
    opt = opt || "";
    if (config.debug) {
        console.log(data, opt);
    }
};