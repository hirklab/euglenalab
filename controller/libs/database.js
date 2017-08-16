var mongoose = require('mongoose');

var config = require('../config');
var logger = require('./logging');

module.exports = function (app, callback) {
	"use strict";

	app.db = mongoose.createConnection(config.DB_URL);
	app.db.on('error', function (err) {
		logger.error(err);
		callback(err);
	});

	app.db.once('open', function () {
		logger.info('database => ' + config.DB_URL);

		require('./models')(app, mongoose);
		callback(null);
	});

	app.db.getExperiments = function (callback) {
		app.db.models.ListExperiment.getInstanceDocument(callback);
	};

	app.db.getBPUs = function (callback) {
		var query = app.db.models.Bpu.find({
			isOn: true
		});

		query.select('_id isOn bpuStatus index name magnification allowedGroups localAddr publicAddr bpu_processingTime session liveBpuExperiment performanceScores');
		query.exec(callback);
	};
};
