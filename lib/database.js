// Node.js Database Script.

// NPM Utilities.
var anyDB = require('any-db');
var params = require('./config.js');
var mkdirp = require('mkdirp');

mkdirp('../build/db/', function(err) {
    if (err) {
        console.error(err);
    }
});
var uuid = (process.argv[2] !== 'harvest') ? params.config.key.uuid : params.uuid;
console.log('Key: ' + uuid);

// Database connection parameters.
if (params.config.database.driver === 'sqlite3') {
    var dbURL = params.config.database.driver + '://' + 'db/' + uuid + '.sqlite3';
} else {
    var dbURL = params.config.database.driver + '://' +
        params.config.database.user + ':' + params.config.database.password +
        '@' + params.config.database.host + '/' + params.config.database.name;
}
var connection = anyDB.createConnection(dbURL);
exports.connection = connection;

// Create the database.
exports.db_create = function(database_name) {
    var database = 'CREATE DATABASE ' + String(database_name);
    connection.query(database, function(err) {
        if (err) {
            throw err;
        }
        console.log('Database "' + database_name + '" has been created.');
    });
};

// Create a table.
exports.db_create_table = function(type) {
    var table = 'CREATE TABLE IF NOT EXISTS ' + String(type) + ' (';
    var schema = params.config.schema[type].fields;
    for (var row in schema) {
        if (schema.hasOwnProperty(row)) {
            var options = '';
            if (schema[row].hasOwnProperty('length')) {
                if (schema[row].hasOwnProperty('options')) {
                    options = ' ' + schema[row].options;
                }
                table += row + ' ' + schema[row].type + '(' + schema[row].length + ')' + options + ', \n';
            } else {
                table += row + ' ' + schema[row].type + options + ', \n';
            }
        }
    }
    table += ' PRIMARY KEY(' + params.config.schema[type].primary_key[0] + '))';
    connection.query(table, function(err) {
        if (err) {
            throw err;
        }
        console.log('Table "' + type + '" has been created.');
    });
};

// Create a lookup table.
exports.db_create_table_lookup = function(type) {
    var table = 'CREATE TABLE IF NOT EXISTS ' + String(type) + ' (';
    table += 'website' + ' ' + 'VARCHAR' + '(' + 255 + ')' + ', \n';
    table += ' PRIMARY KEY(' + 'website' + '))';
    connection.query(table, function(err) {
        if (err) {
            throw err;
        }
        console.log('Table "' + type + '" has been created.');
    });
};

// Truncate the database.
exports.db_truncate_table = function(type) {
    connection.query('DELETE FROM  ' + String(type), function(err) {
        if (err) {
            throw err;
        }
        console.log('Table "' + type + '" has been truncated.');
    });
};

// Insert into the database.
exports.db_insert = function(query, values) {
    connection.query(query, values, function(err) {
        if (err) {
            throw err;
        }
    });
};
