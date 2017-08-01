'use strict';

var mongoose = require('mongoose');


exports = module.exports = function(app) {
	var schema = new mongoose.Schema({
		rating: {
			type: Number,
			default: 0
		},
		notes: {
			type: String,
			default: ''
		},
		experiment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'BPUExperiment'
		}
	});
    return schema;
};