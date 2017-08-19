'use strict';

var mongoose = require('mongoose');

var schema   = new mongoose.Schema({
	ip:   {type: String, default: ''},
	user: {type: String, default: ''},
	time: {type: Date, default: Date.now, expires: '20m'}  // todo push this to config
});

schema.plugin(require('./plugins/pagedFind'));
schema.plugin(require('./plugins/timestamps'));

schema.index({ip: 1});
schema.index({user: 1});
schema.index({createdAt: 1});

// schema.set('autoIndex', app.config.isDevelopment);

module.exports = schema;

