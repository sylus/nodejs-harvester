// Node.js table-condensed(s) Script.

// NPM Utilities.
var uuid = require('./uuid.js');

/**
 * Table class
 *
 * @param {Object} table - The table object.
 * @param {String} address - The web address.
 */
function Table(table, address) {
    var id = new uuid();
    this.name = id.value;
    this.attributes = table[0].attribs.class;
    this.markup = table.prevObject.html();
    this.type = 'table';
}

module.exports = Table;
