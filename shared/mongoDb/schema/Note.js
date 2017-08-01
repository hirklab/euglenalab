'use strict';
var mongoose = require('mongoose');


exports = module.exports = function(app) {
  var schema = new mongoose.Schema({
    data: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
    return schema;
};
