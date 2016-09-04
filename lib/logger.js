// Node.js Logger Script.

// NPM Utilities.
var winston = require('winston');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.File)({
            filename: 'nodejs_harvester.log'
        })
    ]
});
exports.logger = logger;
