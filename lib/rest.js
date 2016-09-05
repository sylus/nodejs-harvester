// Node.js REST Server.

// NPM Utilities.
var database = require('./database.js');
var express = require('express');
var app = express();
var params = require('./config.js');
var path = require('path');
var md = require('marked');

var rootPath = path.normalize(__dirname + '/..');
app.use(express.urlencoded());
app.use(express.json());
app.use(express.favicon(rootPath + '/public/img/favicon.ico'));
app.use(express.static(rootPath + '/public/'));

// Instantiates types from anyDB to REST Route.
exports.rest_get = function(type) {
    app.get('/' + type, function(req, res) {
        database.connection.query('SELECT id, website FROM ' + type +
            ' ORDER BY id ASC', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/' + type + '/:id', function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
            ' WHERE id = "' + req.params.id + '"', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/join/' + type, function(req, res) {
        database.connection.query('SELECT t.id, t.language, l.id AS uuid, l.source, t.website, l.href FROM ' +
            type + ' t INNER JOIN links l ON t.website=l.link', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/join/' + type + '/:id', function(req, res) {
        database.connection.query('SELECT t.id, t.language, l.id AS uuid, l.source, t.website, l.href FROM ' +
            type + ' t INNER JOIN links l ON t.website=l.link WHERE uuid = "' +
            req.params.id + '"', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/join/language/' + type, function(req, res) {
        database.connection.query('SELECT t.id, t.language, l.id AS uuid, l.source, t.website, l.href FROM ' +
            type + ' t INNER JOIN links l ON t.website=l.link WHERE l.href = "' +
            req.query.url + '"', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/all/' + type, function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
        ' INNER JOIN lookup ON ' + type + '.id = lookup.id ORDER BY id ASC LIMIT 50', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });
};

// Instantiates media from anyDB to REST Route.
exports.rest_get_media = function(type) {
    app.get('/' + type, function(req, res) {
        database.connection.query('SELECT DISTINCT id FROM ' + type +
        ' ORDER BY id ASC', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/' + type + '/:id', function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
            ' WHERE id = "' + encodeURI(req.params.id) + '"', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/all/' + type, function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
            ' ORDER BY id ASC', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });
};

// Instantiates links from anyDB to REST Route.
exports.rest_get_links = function(type) {
    app.get('/' + type, function(req, res) {
        database.connection.query('SELECT id FROM ' + type +
            ' ORDER BY id ASC', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/' + type + '/:id', function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
            ' WHERE id = "' + req.params.id + '"', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });

    app.get('/all/' + type, function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
            ' ORDER BY id ASC', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });
};

// Instantiates lookup from anyDB to REST Route.
exports.rest_get_lookup = function(type) {
    app.get('/lookup', function(req, res) {
        database.connection.query('SELECT * FROM ' + type +
            ' ORDER BY website_lang ASC', function(err, result) {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });
};

// Rest vars.
md.setOptions({
    renderer: new md.Renderer(),
    gfm: true,
    tables: true
});

// View.
app.set('views', '../views');
app.set('view engine', 'pug');

// IA
var menus = {
    'architecture': 'Architecture',
    'config': 'Configuration'
};
var breadcrumbs = {
    '/': 'Home'
};

// Main Index Page.
app.get('/', function(req, res) {
    res.render('rest', {
        restful: app.routes,
        title: 'Home - NodeJS Harvester',
        id: 'home',
        menus: menus,
        breadcrumbs: breadcrumbs,
        md: md,
        ui: params.config.ui
    });
});

// Additional Routes.
app.get('/architecture', function(req, res) {
    res.render('architecture', {
        title: 'Architecture',
        id: 'architecture',
        menus: menus,
        breadcrumbs: breadcrumbs,
        md: md,
        ui: params.config.ui
    });
});

// Additional Routes.
app.get('/config', function(req, res) {
    res.render('config', {
        title: 'Configuration Settings',
        id: 'config',
        menus: menus,
        breadcrumbs: breadcrumbs,
        md: md,
        ui: params.config.ui,
        database: params.config.database,
        key: params.config.key
    });
});

// Launch Express.
app.listen(process.env.PORT || 8095);
