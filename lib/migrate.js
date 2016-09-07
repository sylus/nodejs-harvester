// Node.js Migration Script.

// NPM Utilities.
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var migrateuuid = require('node-uuid');
var iconv = require('iconv-lite');
var params = require('./config.js');
var database = require('./database.js');
var files = require('./files.js');
var images = require('./images.js');
var tables = require('./tables.js');
var links = require('./links.js');
var debug = require('./logger.js');

/**
 * ErrorHandler Leveraging the winston logger.
 *
 * @param {Array} err The returned error.
 */
var errorHandler = function(err) {
    if (err) {
        debug.logger.log('error', 'Insertion failed due to: ' + err.code);
    }
};

// Write to Database.
exports.migrate = function(row, type) {
    // Request.
    var url = row.website;

    // Parse the website.
    var request_options = {
        uri: url,
        method: 'GET',
        encoding: null
    };

    // Proxy Support.
    if (params.config.types.hasOwnProperty(type)) {
        var proxy = params.config.types[type].proxy;
        if (proxy) {
            request_options.proxy = proxy;
        }
    }

    request(request_options, function(err, response, html) {
        if (err) {
            return console.error(err);
        }

        // Encoding Support
        if (params.config.types.hasOwnProperty(type)) {
            var encoding = params.config.types[type].encoding;
            if (encoding) {
                html = iconv.decode(html, encoding);
            } else {
                html = iconv.decode(html, 'utf8');
            }
        }

        // Load the page.
        var obj = {
            normalizeWhitespace: false,
            xmlMode: false,
            lowerCaseAttributeNames: false,
            lowerCaseTags: true
        };
        var $ = cheerio.load(html, obj);

        // Query Database.
        var insert = [];
        var rows = [];
        var count = 0;

        // Parse HTML.
        function parseHTML(html) {
            var rendered;
            var table_layout;
            var find;

            // Get the main query selector from csv.
            var rendered_tmp = html.replace('|', '::', '~').split('::', 3);

            // Table conversion to div support (experimental).
            if (params.config.types.hasOwnProperty(type)) {
                table_layout = params.config.types[type].table_layout;
                if (table_layout) {
                    $('td').removeAttr('vAlign');
                    $('td').removeAttr('valign');
                    $('td').removeAttr('colspan');
                    $('td').removeAttr('rowspan');
                    $('table').removeAttr('border');
                    $('table').removeAttr('cellpadding');
                    $('table').removeAttr('cellspacing');
                }
            }

            // Metatag support.
            if (rendered_tmp[1].substr(0, 4) === 'meta') {
                rendered = $(rendered_tmp[1]);
            }

            // Cheerio parameters support.
            find = rendered_tmp[2].split('~');
            if (find.length > 1) {
                var find_css = rendered_tmp[1];
                var find_callback = find[1].split('(');
                var callback_name = find_callback[0];
                var param = find_callback[1].split(')')[0];
                if ($(find_css)[callback_name]()) {
                    if (param) {
                        rendered = $(find_css)[callback_name](param);
                    } else {
                        rendered = $(find_css)[callback_name]();
                    }
                }
            } else {
                rendered = $(rendered_tmp[1]);
            }

            // Remove DOM elements specified from csv.
            var replace_tmp = html.split('|');
            var remove = '';
            for (var i = 1; i < replace_tmp.length; i++) {
                if (replace_tmp[i].indexOf('~')) {
                    remove = replace_tmp[i].split('~')[0];
                } else {
                    remove = replace_tmp[i];
                }
                $(remove).remove();
            }

            // Process Row.
            if (rendered.length >= 1) {
                rendered = rendered.html();
                // Media Processing.
                rendered = rendered.toString().replace(/<a[^<]*<img.*<\/a>/ig, cleanIMG);
                rendered = rendered.toString().replace(/<img[\S\s]*?>/ig, parseIMG);
                rendered = rendered.toString().replace(
                      /<\s*a[^>]+href=[^>]+.\.(?:doc|pdf|pps|ppt|xls)[^>]+>/ig, parseFILE);

                // Link Processing.
                rendered = rendered.toString().replace(/<a [\S\s]*?>/ig, parseLINKS);

                // Table Processing.
                rendered = rendered.toString().replace(/<table [\S\s]*?<\/table>/ig, parseTABLE);

                // Table (legacy HTML) support.
                if (table_layout) {
                    rendered = rendered.toString()
                        .replace(/<table/gi, '<div id=\'table-wrapper\'')
                        .replace(/<tbody/gi, '<div id=\'table\'')
                        .replace(/<tr/gi, '<div')
                        .replace(/<\/tr>/gi, '</div>')
                        .replace(/<td/gi, '<span')
                        .replace(/<\/td>/gi, '</span>')
                        .replace(/<\/tbody/gi, '<\/div')
                        .replace(/<\/table/gi, '<\/div');
                }
            } else {
                rendered = null;
                return rendered;
            }
            return rendered;
        }

        // Parse Text.
        function parseTEXT(text) {
            var rendered;
            var rendered_tmp = text.replace('|', '::').split('::', 2);
            var replace_tmp = text.split('|');
            for (var i = 1; i < replace_tmp.length; i++) {
                var remove = replace_tmp[i];
                $(remove).remove();
            }
            rendered = $(rendered_tmp[1]).first().text();
            if (!rendered) {
                rendered = null;
                return rendered;
            }
            return rendered.replace(/(\r\n|\n|\r|\s+)/gm, ' ');
        }

        // Parse Date.
        function parseDATE(text) {
            var rendered;
            var rendered_tmp = text.replace('|', '::').split('::', 2);
            var replace_tmp = text.split('|');
            for (var i = 1; i < replace_tmp.length; i++) {
                var remove = replace_tmp[i];
                $(remove).remove();
            }
            rendered = $(rendered_tmp[1]).text();
            if (!rendered) {
                if (rendered_tmp[1]) {
                    rendered = rendered_tmp[1];
                    return moment(rendered).unix();
                } else {
                    rendered = null;
                    return rendered;
                }
            }
            var date = rendered
                .replace(/(<([^>]+)>)/ig, '')
                .replace(/(\r\n|\n|\r|\s+)/gm, '');
            // Set Unix Timestamp.
            return moment(date).unix();
        }

        // Parse TAXONOMY.
        function parseTAXONOMY(text) {
            var rendered;
            var rendered_tmp = text.replace('|', '::').split('::');
            var replace_tmp = text.split('|');
            for (var i = 1; i < replace_tmp.length; i++) {
                var remove = replace_tmp[i];
                $(remove).remove();
            }
            rendered = $(rendered_tmp[1]).text();
            if (!rendered) {
                if (rendered_tmp) {
                    rendered_tmp.shift();
                    rendered = rendered_tmp.toString();
                    return rendered;
                } else {
                    rendered = null;
                    return rendered;
                }
            }
            var date = rendered
                .replace(/(<([^>]+)>)/ig, '')
                .replace(/(\r\n|\n|\r|\s+)/gm, '');
            // Set Unix Timestamp.
            return date;
        }

        // Clean HTML for Images inside a href tags.
        function cleanIMG(match) {
            var link_text = 'Place Holder';
            link_text = match.replace(/<img[^<]+\>/ig, link_text);
            return link_text;
        }

        // Parse HTML for Images.
        function parseIMG(match) {
            var imagetmp = cheerio.load(match)('img')[0];
            var image = new images(imagetmp, row.website);
            var imageName = image.name;
            var insertMedia = [];
            var rowMedia = ['$1', '$2', '$3', '$4', '$5'];

            insertMedia.push(image.name);
            insertMedia.push(url);
            insertMedia.push(imageName + image.extension);
            insertMedia.push(image.name + image.extension);
            insertMedia.push(image.type);

            image.saveTo = '../build/files/' + params.uuid + '/';
            database.connection.query('INSERT INTO component_media VALUES (' + rowMedia + ')', insertMedia, function(err) {
                if (err) {
                    debug.logger.log('error', 'Insertion component_media failed due to: ' + err.code);
                } else {
                    image.save();
                }
            });
            return '<img src="[NODEJSHARVEST_IMG:' + image.name + ']" alt="' + image.attributes.alt + '" />';
        }

        // Parse TABLE for Images.
        function parseTABLE(match) {
            var tabletmp = cheerio.load(match)('table');
            var table = new tables(tabletmp, row.website);
            var insertTable = [];
            var rowTable = ['$1', '$2', '$3', '$4', '$5'];

            insertTable.push(table.name);
            insertTable.push(url);
            insertTable.push(table.attributes.toString());
            insertTable.push(table.markup);
            insertTable.push(table.type);

            table.saveTo = '../build/files/' + params.uuid + '/';
            database.connection.query('INSERT INTO component_table VALUES (' + rowTable + ')', insertTable, function(err) {
                if (err) {
                    debug.logger.log('error', 'Insertion component_table failed due to: ' + err.code);
                }
            });
            return '<table src="[NODEJSHARVEST_TABLE:' + table.name + ']" />';
        }

        // Parse HTML for Files.
        function parseFILE(match) {
            var filetmp = cheerio.load(match)('a')[0];
            var file = new files(filetmp, row.website);
            var fileName = file.name;
            var insertFile = [];
            var rowFile = ['$1', '$2', '$3', '$4', '$5'];

            insertFile.push(file.name);
            insertFile.push(url);
            insertFile.push(fileName + file.extension);
            insertFile.push(file.name + file.extension);
            insertFile.push(file.type);

            file.saveTo = '../build/files/' + params.uuid + '/';
            database.connection.query('INSERT INTO component_media VALUES (' + rowFile + ')', insertFile, function(err) {
                if (err) {
                    debug.logger.log('error', 'Insertion component_media failed due to: ' + err.code);
                } else {
                    file.save();
                }
            });
            return '<a href="[NODEJSHARVEST_FILE:' + file.name + ']" >';
        }

        // Parse HTML for Links
        function parseLINKS(match) {
            var atag = cheerio.load(match)('a')[0];
            var link = new links(atag, row.website, type);
            if ((link.link !== null) && (link.host !== null) && link.link.indexOf('NODEJSHARVEST') === -1) {
                var insertLink = [];
                var rowLink = ['$1', '$2', '$3', '$4'];
                var linkClass = (link.attributes.hasOwnProperty('class')) ? link.attributes.class : '';
                var linkRel = (link.attributes.hasOwnProperty('rel')) ? link.attributes.rel : '';
                var linkUUID = migrateuuid.v4();
                insertLink.push(linkUUID);
                insertLink.push(link.source);
                insertLink.push(link.href);
                insertLink.push(link.link);
                database.connection.query('INSERT INTO component_links VALUES (' + rowLink + ')', insertLink, errorHandler);
                return '<a href="[NODEJSHARVEST_LINK:' + linkUUID +
                    ']" class="' + linkClass + '" rel="' + linkRel + '" >';
            } else {
                return match;
            }
        }

        // Parse HTML for Links
        function parseLinksAsync(match, offset, string, callback) {
            if (err) {
                callback(err, null);
            } else {
                var atag = cheerio.load(match)('a')[0];
                var link = new links(atag, row.website, type);
                if ((link.link !== null) && (link.host !== null) && link.link.indexOf('NODEJSHARVEST') === -1) {
                    var insertLink = [];
                    var rowLink = ['$1', '$2', '$3', '$4'];
                    var linkClass = (link.attributes.hasOwnProperty('class')) ? link.attributes.class : '';
                    var linkRel = (link.attributes.hasOwnProperty('rel')) ? link.attributes.rel : '';
                    var linkUUID = migrateuuid.v4();
                    insertLink.push(linkUUID);
                    insertLink.push(link.source);
                    insertLink.push(link.href);
                    insertLink.push(link.link);

                    database.connection.query('SELECT * FROM lookup WHERE website LIKE "%' +
                        link.link.replace(/.*?:\/\//g, '') + '%"', function(err, result) {
                        if (err) {
                            callback(err, null);
                        } else {
                            if (result.rowCount > 0) {
                                database.connection.query('INSERT INTO component_links VALUES (' +
                                    rowLink + ')', insertLink, errorHandler);
                                var value = '<a href="[NODEJSHARVEST_LINK:' +
                                    linkUUID + ']" class="' + linkClass + '" rel="' + linkRel + '" >';
                                callback(null, value);
                            } else {
                                callback(null, match);
                            }
                        }
                    });

                } else {
                    callback(null, match);
                }
            }
        }

        // Cycle through the parameters in YAML.
        var schema = params.config.schema[type].fields;
        for (var migrate_row in schema) {
            if (schema.hasOwnProperty(migrate_row)) {
                count++;
                switch (migrate_row) {
                    case 'id':
                        var id = row[migrate_row];
                        insert.push(id);
                        break;
                    case 'website':
                        var website = row[migrate_row];
                        insert.push(website);
                        break;
                    case 'language':
                        var language = row[migrate_row];
                        insert.push(language);
                        break;
                    case 'pattern':
                        var pattern = row[migrate_row];
                        insert.push(pattern);
                        break;
                    case 'title':
                        var title;
                        if (row[migrate_row].match(/css/g)) {
                            title = parseTEXT(row[migrate_row]);
                        } else {
                            title = row[migrate_row];
                        }
                        if (title !== null && title.length >= 255) {
                            title = title.substring(0, 252) + '...';
                        }
                        insert.push(title);
                        break;
                    case 'body':
                        var body;
                        if (row[migrate_row].match(/css/g)) {
                            body = parseHTML(row[migrate_row]);
                        } else {
                            body = row[migrate_row];
                        }
                        insert.push(body);
                        break;
                    default:
                        var field;
                        if (row[migrate_row].match(/css/g)) {
                            field = parseHTML(row[migrate_row]);
                        } else if (row[migrate_row].match(/date/g)) {
                            field = parseDATE(row[migrate_row]);
                        } else if (row[migrate_row].match(/taxonomy/g)) {
                            field = parseTAXONOMY(row[migrate_row]);
                        } else {
                            field = row[migrate_row];
                        }
                        insert.push(field);
                        break;
                }
                rows.push('$' + count);
            }
        }

        // Insert if title and body != null.
        if (insert[4] && insert[5]) {
            database.connection.query('INSERT INTO ' + type + ' VALUES (' + rows + ')', insert, errorHandler);
        } else {
            debug.logger.log('error', 'Migration Failed for: ' + insert[1]);
        }
    });
};
