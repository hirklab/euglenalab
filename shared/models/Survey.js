'use strict';
var mongoose = require('mongoose');
var schema   = new mongoose.Schema({
	rating:     {
		type:    Number,
		default: 0
	},
	notes:      {
		type:    String,
		default: ''
	},
	experiment: {
		type: mongoose.Schema.Types.ObjectId,
		ref:  'Experiment'
	}
});

schema.plugin(require('./plugins/pagedFind'));
schema.plugin(require('./plugins/timestamps'));

schema.index({createdAt: 1});

// schema.set('autoIndex', app.config.isDevelopment);

module.exports = schema;
