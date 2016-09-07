// Node.js REST Server.

// NPM Utilities.
var params = require('./config.js');
var database = require('./database.js');
var fs = require('fs');

// Helper function to export anyDB to JSON file.
function db_json_export(type, result) {
    var outputFilename = '../build/export/' + params.config.key.uuid + '/' + type + '.json';
    fs.writeFile(outputFilename, JSON.stringify(result, null, 4), function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('JSON saved to ' + outputFilename);
        }
    });
}

// Exports custom types from anyDB to JSON file.
exports.export_type = function(type) {
    database.connection.query('SELECT id, website FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type, result);
        }
    });
    database.connection.query('SELECT * FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type + '_id', result);
        }
    });
};

// Exports media from anyDB to JSON file.
exports.export_media = function(type) {
    database.connection.query('SELECT DISTINCT id FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type, result);
        }
    });
    database.connection.query('SELECT * FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type + '_id', result);
        }
    });
};

// Exports links from anyDB to JSON file.
exports.export_links = function(type) {
    database.connection.query('SELECT id FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type, result);
        }
    });
    database.connection.query('SELECT * FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log('query');
        } else {
            db_json_export(type + '_id', result);
        }
    });
};

// Exports media from anyDB to JSON file.
exports.export_table = function(type) {
    database.connection.query('SELECT DISTINCT id FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type, result);
        }
    });
    database.connection.query('SELECT * FROM ' + type + ' ORDER BY id ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type + '_id', result);
        }
    });
};

// Instantiates lookup from anyDB to REST Route.
exports.export_lookup = function(type) {
    database.connection.query('SELECT * FROM ' + type + ' ORDER BY website_lang ASC', function(err, result) {
        if (err) {
            console.log(err);
        } else {
            db_json_export(type, result);
        }
    });
};
