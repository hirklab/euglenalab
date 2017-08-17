'use strict';

var schemaPath = './';

exports = module.exports = function (app, mongoose) {
	require(schemaPath + '/LoginAttempt')(app, mongoose);
	require(schemaPath + '/User')(app, mongoose);
	require(schemaPath + '/Group')(app, mongoose);
	require(schemaPath + '/Bpu')(app, mongoose);
	require(schemaPath + '/Experiment')(app, mongoose);
	require(schemaPath + '/Survey')(app, mongoose);
	require(schemaPath + '/Note')(app, mongoose);
	require(schemaPath + '/Score')(app, mongoose);
};