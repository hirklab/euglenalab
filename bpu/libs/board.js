var lodash = require('lodash');

var logger      = require('./logging');
var constants   = require('./constants');

var boardConfig = require('./boardConfig').BoardConfig;
var Device      = require('./device');

function Board() {
	this.devices = {};
}

Board.prototype.configure = function () {
	var that = this;

	// todo make it enable disable device based on config
	// todo control from .env file for what devices can work
	// todo control from controller so that we can do this from frontend
	lodash.each(boardConfig.devices, function (device) {
		that.devices[device.name] = new Device(device);
		that.devices[device.name].configure();
	});
};

Board.prototype.getState = function () {
	return this.devices;
};

Board.prototype.setDevice = function (deviceName, value) {
	if (deviceName in this.devices) {
		var device = this.devices[deviceName];

		if (device && device.isValid(value)) {
			device.setValue(value);
		}
	}
};

Board.prototype.getDevice = function (deviceName) {
	if (deviceName in this.devices) {
		return this.devices[deviceName];
	}

	return null;
};

Board.prototype.startRecording = function () {
	this.setDevice('camera', 'start');
};

Board.prototype.stopRecording = function () {
	this.setDevice('camera', 'stop');
};

Board.prototype.startProjector = function () {
	this.setDevice('projector', 'start');
};

Board.prototype.stopProjector = function () {
	this.setDevice('projector', 'stop');
};

Board.prototype.flush = function (duration) {
	var that = this;

	// don't flush more than 20 msec
	// better utilize sample
	// todo make it better so that it achieves goal for flushing => more or less euglena, clean sample etc.
	if (duration > 20) {
		duration = 20;  //msec
	}

	this.setDevice('valve', 1);

	setTimeout(function () {
		that.setDevice('valve', 0);
	}, duration);
};


module.exports = Board;