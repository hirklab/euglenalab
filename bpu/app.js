var constants  = require('./libs/constants');
var Microscope = require('./libs/microscope');

var microscope = new Microscope(
	constants.IP, constants.PORT,
	constants.UNIQUE_ID,
	constants.NAME
);

microscope.initialize();