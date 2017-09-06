'use strict';

var schemaPath = '../../shared/models';

exports = module.exports = function (app, mongoose) {
	require(schemaPath + '/index')(app, mongoose);
};
