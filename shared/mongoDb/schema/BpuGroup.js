'use strict';
var mongoose = require('mongoose');

exports = module.exports = function(app) {
  var schema = new mongoose.Schema({
    name: { type: String, default: 'default' },
    description: { type: String, default: 'default' },
    users: { type: Array, default: [] },
  });
  schema.plugin(require('./plugins/pagedFind'));
  schema.index({ name: 1 });
  schema.set('autoIndex', app.config.isDevelopment);
    return schema;
};
