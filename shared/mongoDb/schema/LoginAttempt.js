'use strict';

var mongoose = require('mongoose');

exports = module.exports = function(app) {
  var schema = new mongoose.Schema({
    ip: { type: String, default: '' },
    user: { type: String, default: '' },
    time: { type: Date, default: Date.now, expires: app.config.loginAttempts.logExpiration }
  });
  schema.index({ ip: 1 });
  schema.index({ user: 1 });
  schema.set('autoIndex', app.config.isDevelopment);
    return schema;
};
