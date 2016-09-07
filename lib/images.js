// Node.js Image(s) Script.

// NPM Utilities.
var fs = require('fs');
var http = require('follow-redirects').http;
var https = require('follow-redirects').https;
var path = require('path');
var url = require('url');
var params = require('./config.js');
var mkdirp = require('mkdirp');

/**
 * Image class
 *
 * @param {Object} image - The image object.
 * @param {String} address - The web address.
 */
function Image(image, address) {
    // Assign image attributes.
    var at = this.attributes = image.attribs;

    // Assign src splitting a potential query paramater.
    at.src = at.src.split('?')[0];

    // Assign url derived mappings.
    this.address = url.resolve(address, at.src);
    this.fromAddress = address;

    // Additional logic for images.
    var parsedUrl = url.parse(this.address);
    this.protocol = (parsedUrl.protocol === 'https:') ? https : http;
    this.host = parsedUrl.host;
    this.pathname = parsedUrl.pathname;

    // Assign file information mappings.
    var tmp_name = path.basename(at.src, path.extname(at.src));
    this.name = tmp_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.saveTo = path.dirname(require.main.filename) + '/files/' + params.uuid + path.dirname(parsedUrl.pathname) + '/';
    this.extension = path.extname(at.src);
    this.metadata = at.alt;
    this.type = 'image';
}

// Image Save.
Image.prototype.save = function() {
    // Reference to the current instance.
    var _this = this;

    // Params for Request.
    var options = {
        host: _this.host,
        headers: {
            'user-agent': 'Mozilla/5.0'
        },
        path: _this.pathname,
        method: 'GET',
        timeout: 5000,
        followRedirect: true,
        maxRedirects: 5
    };

    // Process the image.
    mkdirp(_this.saveTo, function(err) {
        if (err) {
            console.error(err);
        } else {
            var image = fs.createWriteStream(path.normalize(_this.saveTo + _this.name + _this.extension));
            var request = _this.protocol.get(options, function(res) {
                res.on('data', function(data) {
                    image.write(data);
                }).on('end', function() {
                    image.end();
                });
            });
            request.on('error', function(err) {
                // Handle error
                console.log(err);
            });
            request.end();
        }
    });
};

module.exports = Image;
