// Node.js Configuration Script.

// NPM Utilities.
var yaml = require('js-yaml');
var fs = require('fs');
var uuid = require('./uuid.js');

// YAML Conf.
try {
    var config = yaml.safeLoad(fs.readFileSync('../config/config.yml', 'utf8'));
    var patterns = yaml.safeLoad(fs.readFileSync('../config/patterns.yml', 'utf8'));
    var id = new uuid();
    console.log(id);
    exports.config = config;
    exports.patterns = patterns;
    exports.uuid = id.value;
} catch (e) {
    console.log(e);
}
