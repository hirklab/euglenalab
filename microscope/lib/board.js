import _ from 'lodash';
import Device from './device';
import logger from './logging';
import BoardConfig from './boardConfig';


class Board {
	constructor() {
		this.state = {};
		this.devices = [];
		this.configure();
	}

	configure() {
		_.each(BoardConfig.devices, (device) => {
			this.devices.push(new Device(device));
		});
	}

	getState() {
		return this.state;
	}

	setDevice(deviceName, value) {
		let device = _.find(this.devices, (device) => {
			return device.name == deviceName;
		});

		if (device && device.isValid(value)) {
			device.setValue(value);
		}
	}

	getDevice(deviceName) {
		return _.find(this.devices, (device) => {
			return device.name == deviceName;
		})
	}
}

export default Board;