var lodash = require('lodash');

var constants = require('./constants');
var rpi       = require(constants.IS_FAKE ? './raspberrypi' : 'wiring-pi');

var logger      = require('./logging');
var boardConfig = require('./boardConfig').BoardConfig;
var MODE        = require('./boardConfig').MODE;
var TYPE        = require('./boardConfig').TYPE;


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
	if (this.pin <= 40) {
		rpi.pinMode(this.pin, this.io);
	}

	switch (this.mode) {
		case MODE.SOFTPWM:
			rpi.softPwmCreate(this.pin, this.options.min, this.options.max);
			break;
		default:
			break;
	}

	if (this && this.isValid(this.options.default)) {
		this.setValue(this.options.default);
	}
}

Device.prototype.isValid = function (value) {
	var isValid = false;

	switch (this.type) {
		case TYPE.STATE:
			isValid = lodash.includes(lodash.values(this.options.states), value);
			// logger.debug('${lodash.values(this.options.states)} contains ${value} ? ${isValid}');
			break;
		case TYPE.NUMERIC:
			isValid = (value >= this.options.min) && (value <= this.options.max);
			// logger.debug('${this.options.min} <= ${value} <= ${this.options.max} ? ${isValid}');
			break;
		default:
			isValid = true;
			// logger.debug('default ? ${isValid}');
			break;
	}

	return isValid;
}

Device.prototype.setValue = function (value) {
	switch (this.mode) {
		case MODE.DIGITAL:
			rpi.digitalWrite(this.pin, value);
			this.value = value;
			logger.debug(this.name + ': ' + value);
			break;

		case MODE.SOFTPWM:
			rpi.softPwmWrite(this.pin, value);
			this.value = value;
			logger.debug(this.name + ': ' + value);
			break;

		case MODE.SOCKET:
			if (!constants.IS_FAKE) {
				var self   = this;
				var client = new net.Socket();

				client.connect(this.pin, 'localhost', function () {
					client.write(value);
					self.value = value;
					logger.debug(self.name + ': ' + value);
				});

				client.on('error', function (err) {
					logger.error(self.name + ': ' + err);
				});
			} else {
				rpi.socketWrite(this.pin, value);
				this.value = value;
				logger.debug(this.name + ': ' + value);
			}
			break;

		default:
			this.value = value;
			logger.debug(this.name + ': ' + value);
			break;
	}
}

Device.prototype.getValue = function () {
	return this.value;
}


module.exports = Device;