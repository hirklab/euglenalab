'use strict';

var mongoose = require('mongoose');
var schema   = new mongoose.Schema({
	bpu:         {
		type: mongoose.Schema.Types.ObjectId,
		ref:  'Bpu'
	},
	experiment:  {
		type: mongoose.Schema.Types.ObjectId,
		ref:  'Experiment'
	},
	population:  {
		type:    Number,
		default: -1
	},
	activity:    {
		type:    Number,
		default: -1
	},
	response:    {
		type:    Number,
		default: -1
	},
	performance: {
		type:    Number,
		default: -1
	}
});

schema.plugin(require('./plugins/pagedFind'));
schema.plugin(require('./plugins/timestamps'));

schema.index({createdAt: 1});

// schema.set('autoIndex', app.config.isDevelopment);

module.exports = schema;
