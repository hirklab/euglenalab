import _ from 'lodash';
import Device from './device';
import logger from './logging';
import BoardConfig from './boardConfig';


class Board {
	constructor() {
		this.state = {};
		this.devices = {};
		this.configure();
	}

	configure() {
		_.each(BoardConfig.devices, (device) => {
			this.devices[device.name] = new Device(device);
		});
	}

	getState() {
		return this.state;
	}

	setDevice(deviceName, value) {
		if (deviceName in this.devices) {
			let device = this.devices[deviceName];

			if (device && device.isValid(value)) {
				device.setValue(value);
			}
		}
	}

	getDevice(deviceName) {
		if (deviceName in this.devices) {
			return this.devices[deviceName];
		}

		return null;
	}
}

export default Board;
