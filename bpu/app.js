var constants  = require('./libs/constants');
var logger  = require('./libs/logging');
var Microscope = require('./libs/microscope');

var microscope = new Microscope(
	constants.IP, constants.PORT,
	constants.UNIQUE_ID,
	constants.NAME
);

microscope.initialize(function(err){
	if(err){
		logger.error(err);
	}
});