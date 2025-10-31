const NodeCache = require("node-cache");

const cache = new Cache({ stdTTL: 600});

console.log("Cache iniciado.");

module.exports = cache; 