// Node.js Files Script.

// NPM Utilities.
var uuid = require('node-uuid');

// UUID class.
function UUID() {
    this.value = uuid.v4();
}

module.exports = UUID;
