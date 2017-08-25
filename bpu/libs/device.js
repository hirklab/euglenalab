var lodash = require('lodash');
var net    = require('net');

var constants = require('./constants');
var rpi       = require(constants.IS_FAKE ? './raspberrypi' : 'wiring-pi');

var logger      = require('./logging');
var boardConfig = require('./boardConfig').BoardConfig;
var MODE        = require('./boardConfig').MODE;
var TYPE        = require('./boardConfig').TYPE;
var IO          = require('./boardConfig').IO;


function Device(device) {
	rpi.setup('sys');

	this.name    = device.name;
	this.pin     = device.pin;
	this.mode    = device.mode;
	this.io      = device.io;
	this.type    = device.type;
	this.options = device.options;
	this.value   = null;
}

Device.prototype.configure = function () {
	var self = this;

	if (self.pin <= 40) {
		rpi.pinMode(self.pin, self.io);
	}

	switch (self.mode) {
		case MODE.SOFTPWM:
			rpi.softPwmCreate(self.pin, self.options.min, self.options.max);
			break;
		default:
			break;
	}

	if (self && self.isValid(self.options.default)) {
		self.setValue(self.options.default);
	}
};

Device.prototype.isValid = function (value) {
	var self = this;

	var isValid = false;

	switch (this.type) {
		case TYPE.STATE:
			isValid = lodash.includes(lodash.values(self.options.states), value);
			// logger.debug('${lodash.values(this.options.states)} contains ${value} ? ${isValid}');
			break;
		case TYPE.NUMERIC:
			isValid = (value >= self.options.min) && (value <= self.options.max);
			// logger.debug('${this.options.min} <= ${value} <= ${this.options.max} ? ${isValid}');
			break;
		default:
			isValid = true;
			// logger.debug('default ? ${isValid}');
			break;
	}

	return isValid;
};

Device.prototype.setValue = function (value) {
	var self = this;

	switch (self.mode) {
		case MODE.DIGITAL:
			rpi.digitalWrite(self.pin, value);
			this.value = value;
			logger.debug(self.name + ': ' + value);
			break;

		case MODE.SOFTPWM:
			rpi.softPwmWrite(self.pin, value);
			this.value = value;
			logger.debug(self.name + ': ' + value);
			break;

		case MODE.SOCKET:
			if (!constants.IS_FAKE) {

				// var startSocket = function(){
				var client = new net.Socket();

				client.connect(self.pin, 'localhost', function () {
					client.write(value);
					self.value = value;
					logger.debug(self.name + ': ' + value);
				});

				client.on('error', function (err) {
					logger.error(self.name + ': ' + err);
				});

				// 	client.on('close', function() {
				// 		setTimeout(startSocket(), 5000);
				// 	});
				// };

			} else {
				rpi.socketWrite(self.pin, value);
				this.value = value;
				logger.debug(self.name + ': ' + value);
			}
			break;

		default:
			this.value = value;
			logger.debug(self.name + ': ' + value);
			break;
	}
};

Device.prototype.getValue = function () {
	return this.value;
};


module.exports = Device;