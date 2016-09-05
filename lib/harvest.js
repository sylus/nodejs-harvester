// Node.js Main Script.

// NPM Utilities.
var csv = require('csv');
var mkdirp = require('mkdirp');
var params = require('./config.js');
var database = require('./database.js');
var migrate = require('./migrate.js');
var rest = require('./rest.js');
var exportable = require('./export.js');

/**
 * Harvester
 *
 * @param {String} csvfile - CSV file to read from.
 * @param {String} type - Type to read from.
 */
function harvest_type(csvfile, type) {
    database.db_create_table(type);

    if (process.argv[2] === 'harvest') {
        database.db_truncate_table(type);
    }

    // Read from CSV.
    if (process.argv[2] === 'harvest') {
        csv()
            .from(csvfile, {
                columns: true
            })
            .transform(function(row) {
                return row;
            })
            .to.array(function(data) {
                var linesProcess;
                if (process.argv[3]) {
                    linesProcess = process.argv[3];
                } else {
                    linesProcess = data.length;
                }
                for (var row = 0; row < linesProcess; row++) {
                    migrate.migrate(data[row], type, params.uuid);
                }
            })
            .on('record', function() {
                //console.log('Parsed: ' + row.website);
            })
            .on('close', function(count) {
                if (process.argv[3]) {
                    count = process.argv[3];
                }
                console.log('Number of websites: ' + count);
            })
            .on('end', function(count) {
                if (process.argv[3]) {
                    count = process.argv[3];
                }
                console.log('Number of websites: ' + count);
            });
    }

    // Initialize RESTFUL JSON for this type.
    rest.rest_get(type);

    // Export DB as JSON file for this type.
    if (process.argv[2] === 'export') {
        exportable.export_type(type);
    }
}

/**
 * Harvester Lookup Type
 *
 * @param {String} csvfile - CSV file to read from.
 * @param {String} type - Type to read from.
 */
function harvest_lookup_type(csvfile, type) {
    // Read from CSV.
    if (process.argv[2] === 'harvest') {

        csv()
            .from(csvfile, {
                columns: true
            })
            .to.array(function(data) {
                var linesProcess;
                if (process.argv[3]) {
                    linesProcess = process.argv[3];
                } else {
                    linesProcess = data.length;
                }
                for (var row = 0; row < linesProcess; row++) {
                    var insertLookup = [];
                    var rowLookup = ['$1', '$2'];
                    if (data[row].language === 'en') {
                        insertLookup.push(data[row].id + '_fr');
                    } else {
                        insertLookup.push(data[row].id.replace('_fr', ''));
                    }
                    insertLookup.push(data[row].website);
                    database.db_insert('INSERT INTO ' + type + ' VALUES (' + rowLookup + ')', insertLookup);
                }
            });
    }
}

/**
 * Harvester Lookup
 *
 * @param {String} type - Type to read from.
 */
function harvest_lookup(type) {
    database.db_create_table_lookup(type);

    if (process.argv[2] === 'harvest') {
        database.db_truncate_table(type);
    }

    // Generate tables via YAML conf.
    for (var lookup_type in params.config.types) {
        if (params.config.types.hasOwnProperty(lookup_type)) {
            var csvFile = params.config.types[lookup_type].csv;
            harvest_lookup_type(csvFile, type);
        }
    }

    // RESTFUL JSON for media.
    rest.rest_get_lookup(type);

    // Export DB as JSON file for this type.
    if (process.argv[2] === 'export') {
        exportable.export_lookup(type);
    }
}

/**
 * Harvester Media
 *
 * @param {String} type - Type to read from.
 */
function harvest_media(type) {
    database.db_create_table(type);

    if (process.argv[2] === 'harvest') {
        database.db_truncate_table(type);
    }

    // RESTFUL JSON for media.
    rest.rest_get_media(type);

    // Export DB as JSON file for this type.
    if (process.argv[2] === 'export') {
        exportable.export_media(type);
    }
}

/**
 * Harvester Links
 *
 * @param {String} type - Type to read from.
 */
function harvest_links(type) {
    database.db_create_table(type);

    if (process.argv[2] === 'harvest') {
        database.db_truncate_table(type);
    }
    // RESTFUL JSON for links.
    rest.rest_get_links(type);

    // Export DB as JSON file for this type.
    if (process.argv[2] === 'export') {
        exportable.export_links(type);
    }
}

/**
 * Represent the main execution of script.
 */
function harvest() {
    // Prepare standard directories.
    mkdirp('../build/files/' + params.uuid + '/', function(err) {
        if (err) {
            console.error(err);
        }
    });

    // Prepare diectory for export.
    if (process.argv[2] === 'export') {
        mkdirp('../build/export/' + params.config.key.uuid + '/', function(err) {
            if (err) {
                console.error(err);
            }
        });
    }

    // Create lookup table.
    harvest_lookup('lookup');

    // Create global tables.
    harvest_media('media');
    harvest_links('links');

    // Generate tables via YAML conf.
    for (var type in params.config.types) {
        if (params.config.types.hasOwnProperty(type)) {
            var csvFile = params.config.types[type].csv;
            harvest_type(csvFile, type);
        }
    }
}

harvest();
