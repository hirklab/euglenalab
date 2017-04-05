import env from 'dotenv';
import net from 'net';
import logger from './logging';
import {
	TYPE,
	MODE,
	IO
} from './boardConfig';

env.config();
const MACHINE = process.env.MACHINE;

const rpi = require(MACHINE == 'raspberrypi' ? 'wiring-pi' : './raspberrypi');


class Device {
	constructor(device) {
		rpi.setup('sys');

		this.name = device.name;
		this.pin = device.pin;
		this.mode = device.mode;
		this.io = device.io;
		this.type = device.type;
		this.options = device.options;

		this.configure();
	}

	configure() {
		switch (this.type) {
			case TYPE.STATE:
				this.states = this.options.states;
				this.default = this.options.default;
				break;
			case TYPE.NUMERIC:
				this.min = this.options.min;
				this.max = this.options.max;
				this.default = this.options.default;
				break;
			default:
				this.default = null;
		}

		if (this.pin < 40) {
			rpi.pinMode(this.pin, this.io);
		}

		switch (this.mode) {
			case MODE.SOFTPWM:
				rpi.softPwmCreate(this.pin, this.min, this.max);
				break;
			default:
				break;
		}

		this.setValue(this.default);
	}

	isValid(value) {
		let isValid = false;

		switch (this.type) {
			case TYPE.STATE:
				isValid = _.includes(_.values(this.states), value)
				break;
			case TYPE.NUMERIC:
				isValid = (value >= min) && (value <= max);
				break;
			default:
				isValid = true;
				break;
		}

		return isValid;
	}

	setValue(value) {
		switch (this.mode) {
			case MODE.DIGITAL:
				rpi.digitalWrite(this.pin, value);
				this.value = value;
				break;

			case MODE.SOFTPWM:
				rpi.softPwmWrite(this.pin, value);
				this.value = value;
				break;
			case MODE.SOCKET:
				if (MACHINE == 'raspberrypi') {
					let self = this;
					let client = new net.Socket();

					client.connect(this.pin, 'localhost', () => {
						client.write(value);
						self.value = value;
					});

					client.on('error', (err) => {
						logger.error(`${this.name}: ${err}`);
					});
				} else {
					rpi.socketWrite(this.pin, value);
					this.value = value;
				}
				break;
			default:
				this.value = value;
				break;
		}

		console.log(`${this.name}: ${value}`);
	}

	getValue() {
		return this.value;
	}
}

export default Device;