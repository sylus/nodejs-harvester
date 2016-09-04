// Node.js Links Script.

// NPM Utilities.
var url     = require('url');
var params  = require('./config.js');

/**
 * Link class
 *
 * @param {Object} link - The link object.
 * @param {String} address - The web address.
 * @param {String} type - The type from YAML.
 */
function Link(link, address, type) {
    var at = this.attributes = link.attribs;
    var parsedUrl = url.parse(address);
    var absoluteUrl = normalizeLink(parsedUrl, at.href);
    this.source = address;
    this.href = at.href;
    this.link = absoluteUrl;
    this.host = null;
    if (this.link) {
        var hostarr = params.config.types[type].host;
        for (var hostsrc in hostarr) {
            var hostsource = url.parse(hostarr[hostsrc]);
            var hostdest = url.parse(this.link);
            // Check if host has a path specified to match.
            // Otherwise just match based on host.
            var hostpath = hostsource.path.split('/')[1];
            if (hostdest.path && hostpath) {
                if (hostdest.path.indexOf(hostpath) > -1) {
                    if (hostsource.host === hostdest.host) {
                        this.host = hostdest.host;
                        break;
                    }
                    this.host = null;
                }
            } else {
                if (hostsource.host === hostdest.host) {
                    this.host = hostdest.host;
                    break;
                }
                this.host = null;
            }
        }
    }
}

/**
 * NormalizeLink function
 *
 * @param {String} parsedUrl - The link object.
 * @param {String} scrapedHref - The web address.
 */
function normalizeLink(parsedUrl, scrapedHref) {
    if (!scrapedHref || !parsedUrl) {
        return null;
    }
    /*jshint scripturl:true*/
    if (scrapedHref.indexOf('javascript:') === 0) {
        return null;
    }
    if (scrapedHref.indexOf('#') === 0) {
        return null;
    }
    if (scrapedHref.indexOf('#') > -1) {
        return null;
    }

    var scrapedUrl = url.parse(scrapedHref);
    if (scrapedUrl.host !== null) {
        return scrapedHref;
    }
    if (scrapedHref.indexOf('/') === 0) {
        return parsedUrl.protocol + '//' + parsedUrl.host + scrapedHref;
    }
    if (scrapedHref.indexOf('(') > 0 && scrapedHref.indexOf(')') > 0) {
        return null;
    }

    var pos = parsedUrl.href.lastIndexOf('/');
    if (pos >= 0) {
        var count = scrapedHref.split('../').length;
        if (count > 0) {
            pos = getNthOccurence(parsedUrl.href, '/', count);
            scrapedHref = scrapedHref.replace(/\.\.\//g, '');
        }
        var surl = parsedUrl.href.substring(0, pos + 1);
        return surl + scrapedHref;
    } else {
        return parsedUrl.href + '/' + scrapedHref;
    }
}

/**
 * getNthOccurence function.
 */
function getNthOccurence(str, substring, n) {
    var times = 0;
    var index = str.length;
    while (times < n && index !== -1) {
        index = str.lastIndexOf(substring, index - 1);
        times++;
    }
    return index;
}

module.exports = Link;
