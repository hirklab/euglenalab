'use strict';

var mainConfig = require('../../shared/mainConfig.js');

module.exports.mainConfig            = mainConfig;
module.exports.port                  = process.env.PORT || mainConfig.adminFlags.getWebServerPort();
module.exports.myServerPort          = module.exports.port;
module.exports.myServerAddr          = mainConfig.adminFlags.getWebServerAddr();
module.exports.controllerAddress     = mainConfig.adminFlags.getControllerAddress();
module.exports.myControllerPort      = mainConfig.adminFlags.getControllerPort();
module.exports.myWebServerIdentifier = mainConfig.adminFlags.getWebServerIdentifier();
module.exports.myWebServerName       = mainConfig.adminFlags.getWebServerName();
module.exports.mongodb               = {
	uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || mainConfig.adminFlags.getMongoUri()
};

module.exports.companyName = 'Riedel-Kruse Lab';
module.exports.projectName = 'Interactive Microbiology Lab';
module.exports.systemEmail = 'euglena.hirk@gmail.com';

module.exports.cryptoKey = 'k3yb0ardc4t';

module.exports.loginAttempts = {
	forIp:         50,
	forIpAndUser:  7,
	logExpiration: '20m'
};

module.exports.requireAccountVerification = false;

module.exports.smtp = {
	from:        {
		name:    process.env.SMTP_FROM_NAME || module.exports.projectName,
		address: process.env.SMTP_FROM_ADDRESS || module.exports.systemEmail
	},
	credentials: {
		user:     process.env.SMTP_USERNAME || module.exports.systemEmail,
		password: process.env.SMTP_PASSWORD || 'IngmarE350A',
		host:     process.env.SMTP_HOST || 'smtp.gmail.com',
		ssl:      true
	}
};
