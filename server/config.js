'use strict';

var mainConfig = require('../shared/mainConfig.js');

exports.mainConfig            = mainConfig;
exports.port                  = process.env.PORT || mainConfig.adminFlags.getWebServerPort();
exports.myServerPort          = exports.port;
exports.myServerAddr          = mainConfig.adminFlags.getWebServerAddr();
exports.controllerAddress     = mainConfig.adminFlags.getControllerAddress();
exports.myControllerPort      = mainConfig.adminFlags.getControllerPort();
exports.myWebServerIdentifier = mainConfig.adminFlags.getWebServerIdentifier();
exports.myWebServerName       = mainConfig.adminFlags.getWebServerName();
exports.mongodb               = {
	uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || mainConfig.adminFlags.getMongoUri()
};

exports.companyName = 'Riedel-Kruse Lab';
exports.projectName = 'Interactive Microbiology Lab';
exports.systemEmail = 'euglena.hirk@gmail.com';

exports.cryptoKey = 'k3yb0ardc4t';

exports.loginAttempts = {
	forIp:         50,
	forIpAndUser:  7,
	logExpiration: '20m'
};

exports.requireAccountVerification = false;

exports.smtp = {
	from:        {
		name:    process.env.SMTP_FROM_NAME || exports.projectName,
		address: process.env.SMTP_FROM_ADDRESS || exports.systemEmail
	},
	credentials: {
		user:     process.env.SMTP_USERNAME || exports.systemEmail,
		password: process.env.SMTP_PASSWORD || 'IngmarE350A',
		host:     process.env.SMTP_HOST || 'smtp.gmail.com',
		ssl:      true
	}
};
