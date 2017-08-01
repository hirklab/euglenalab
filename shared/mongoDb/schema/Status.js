'use strict';
var mongoose = require('mongoose');


exports = module.exports = function(app) {
  var schema = new mongoose.Schema({
    _id: { type: String },
    pivot: { type: String, default: '' },
    name: { type: String, default: '' }
  });
  schema.plugin(require('./plugins/pagedFind'));
  schema.index({ pivot: 1 });
  schema.index({ name: 1 });
  schema.set('autoIndex', app.config.isDevelopment);
    return schema;
};
