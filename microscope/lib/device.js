import rpi from 'wiring-pi';
import net from 'net';
import logger from './logging';

class Device {
	constructor(device) {
		rpi.setup('sys');

		this.name = device.name;
		this.pin = device.pin;
		this.mode = device.mode;
		this.io = device.io;
		this.type = device.type;

		this.configure();
	}

	configure() {
		switch (this.type) {
			case STATE:
				this.states = this.options.states;
				this.default = this.options.default;
				break;
			case NUMERIC:
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
		//todo 
		return true;
	}

	setValue(value) {
		switch (mode) {
			case MODE.DIGITAL:
				rpi.digitalWrite(this.pin, value);
				this.value = value;
				break;

			case MODE.SOFTPWM:
				rpi.softPwmWrite(this.pin, value);
				this.value = value;
				break;
			case MODE.SOCKET:
				(() => {
					let client = new net.Socket();
					client.connect(this.pin, 'localhost', () => {
						client.write(value);
						this.value = value;
					});
					client.on('error', (err) => {
						logger.error(err);
					});
				})();
				break;
			default:
				this.value = value;
				break;
		}

		console.log(this.value);
	}

	getValue() {
		return this.value;
	}
}

export default Device;