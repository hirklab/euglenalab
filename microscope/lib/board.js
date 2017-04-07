import _ from 'lodash';
import Device from './device';
import logger from './logging';
import BoardConfig from './boardConfig';


class Board {
	constructor() {
		this.state = {};
		this.devices = {};
	}

	configure() {
		_.each(BoardConfig.devices, (device) => {
			this.devices[device.name] = new Device(device);
			this.devices[device.name].configure();
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

	startRecording(){
        this.setDevice('camera','start');
    }

    stopRecording(){
        this.setDevice('camera','stop');
    }

	flush(duration){
        //sanity check
        if(duration>20){
            duration = 20;
        }

        this.setDevice('valve', 1);
        setTimeout(()=>{
            this.setDevice('valve', 0);
        },duration);
	}
}

export default Board;