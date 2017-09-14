var mongoose = require('mongoose');

var config = require('./config');
var logger = require('./logging');

var schemaPath = '../../shared/models';

module.exports = function (app, callback) {
	"use strict";

	if(!(app.hasOwnProperty('db') && app.db)) {

		mongoose.Promise = global.Promise;
		app.db           = mongoose.createConnection(config.DB_URL);

		app.db.on('error', function (err) {
			logger.error(err);
			callback(err, app.db);
		});

		app.db.once('open', function () {
			logger.info('database => ' + config.DB_URL);

			require(schemaPath + '/index')(app, mongoose);
			callback(null, app.db);
		});

		// app.db.getExperiments = function (callback) {
		// 	app.db.models.ListExperiment.getInstanceDocument(callback);
		// };

		app.db.getBPUs = function (cb) {
			var query = app.db.models.Bpu.find({
				isActive: true
			});

			query.select('_id isActive status index name magnification groups localAddr publicAddr experiment');
			query.exec(cb);
		};
	}else{
		callback(null, app.db);
	}
};
