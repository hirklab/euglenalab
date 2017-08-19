'use strict';
var mongoose = require('mongoose');


var schema = new mongoose.Schema({
	type: {
		type: String,
		enum: ['live', 'batch']
	},

	description: {type: String, default: ''},

	duration: {
		type:    Number,
		default: 0
	},

	machine: {
		ip:       {type: String},
		hostname: {type: String},
		city:     {type: String},
		region:   {type: String}
	},

	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref:  'User'
	},

	bpu: {
		type: mongoose.Schema.Types.ObjectId,
		ref:  'Bpu'
	},

	proposedEvents: {
		type:    Array,
		default: []
	},

	actualEvents: {
		type:    Array,
		default: []
	},

	status: {
		type:    String,
		enum:    ['created', 'queued', 'submitting', 'running', 'executed', 'processing', 'failed', 'finished', 'canceled'],
		default: 'created'
	},

	reason: {
		type:    String,
		default: null
	},

	isProfiling: {
		type:    Boolean,
		default: false
	},

	submittedAt: {
		type:    Date,
		default: null
	},

	queuedAt: {
		type:    Date,
		default: null
	},

	startedAt: {
		type:    Date,
		default: null
	},

	executedAt: {
		type:    Date,
		default: null
	},

	failedAt: {
		type:    Date,
		default: null
	},


	canceledAt: {
		type:    Date,
		default: null
	},

	finishedAt: {
		type:    Date,
		default: null
	},

	rating: {
		type:    Number,
		default: 0
	},

	processing: {
		disabled:   {
			type:    Boolean,
			default: false
		},
		startedAt:  {
			type:    Date,
			default: null
		},
		failedAt:   {
			type:    Date,
			default: null
		},
		canceledAt: {
			type:    Date,
			default: null
		},

		finishedAt:     {
			type:    Date,
			default: null
		},
		status:         {
			type:    String,
			enum:    ['created', 'queued', 'running', 'failed', 'finished', 'canceled'],
			default: 'created'
		},
		images:         {
			type:    Array,
			default: []
		},
		lightData:      {
			type:    Array,
			default: []
		},
		inputFilePath:  {
			type:    String,
			default: null
		},
		outputFilePath: {
			type:    String,
			default: null
		}
	}
});

schema.plugin(require('./plugins/pagedFind'));
schema.plugin(require('./plugins/timestamps'));

schema.index({bpu: 1});
schema.index({user: 1});
schema.index({name: 1});
schema.index({createdAt: 1});

// schema.set('autoIndex', app.config.isDevelopment);

schema.methods.cancel = function (callback) {
	this.status = 'canceled';
	this.save(callback);
};

module.exports = schema;


var checkNum = function (num, low, high) {
	if (num !== null && num !== undefined) {
		if (num < low) return 'out of bounds (<' + low + ')';
		else if (num > high) return 'out of bounds (>' + high + ')';
		else return null;
	} else {
		return 'missing';
	}
};
