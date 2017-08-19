'use strict';

var schemaPath = './';

module.exports = function (app, mongoose) {
	app.db.model('LoginAttempt', require(schemaPath + '/LoginAttempt'));
	app.db.model('User', require(schemaPath + '/User'));
	app.db.model('Group', require(schemaPath + '/Group'));
	app.db.model('Bpu', require(schemaPath + '/Bpu'));
	app.db.model('Experiment', require(schemaPath + '/Experiment'));
	app.db.model('Survey', require(schemaPath + '/Survey'));
	app.db.model('Note', require(schemaPath + '/Note'));
	app.db.model('Score', require(schemaPath + '/Score'));
};