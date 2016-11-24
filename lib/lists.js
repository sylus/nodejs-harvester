// Node.js list-condensed(s) Script.

// NPM Utilities.
var uuid = require('./uuid.js');

/**
 * List class
 *
 * @param {Object} list - The list object.
 * @param {String} address - The web address.
 */
function List(list, address) {
    var id = new uuid();
    this.name = id.value;
    this.attributes = list[0].attribs.class;
    this.markup = list.prevObject.html();
    this.type = 'ol';
}

module.exports = List;
