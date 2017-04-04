import rpi from 'wiring-pi';

export const MODE = {
	ANALOG: 0,
	DIGITAL: 1,
	SOFTPWM: 2,
	HARDPWM: 3,
	SOCKET: 4
};

export const IO = {
	INPUT: rpi.INPUT,
	OUTPUT: rpi.OUTPUT,
	// todo 
	// check what should be this value in rpi
	BOTH: 2
};

export const TYPE = {
	STATE: 0,
	NUMERIC: 1,
};


let BoardConfig = {
	//todo 
	//check this run pin 
	RunPin: 9,

	version: '1.0',
	model: 'raspberrypi 3.0',
	devices: [{
		name: 'topLED',
		pin: 24,
		mode: MODE.SOFTPWM,
		type: TYPE.NUMERIC,
		io: IO.OUTPUT,
		options: {
			min: 0,
			max: 100,
			default: 1
		}
	}, {
		name: 'rightLED',
		pin: 25,
		mode: MODE.SOFTPWM,
		type: TYPE.NUMERIC,
		io: IO.OUTPUT,
		options: {
			min: 0,
			max: 100,
			default: 1
		}
	}, {
		name: 'bottomLED',
		pin: 3,
		mode: MODE.SOFTPWM,
		type: TYPE.NUMERIC,
		io: IO.OUTPUT,
		options: {
			min: 0,
			max: 100,
			default: 1
		}
	}, {
		name: 'leftLED',
		pin: 8,
		mode: MODE.SOFTPWM,
		type: TYPE.NUMERIC,
		io: IO.OUTPUT,
		options: {
			min: 0,
			max: 100,
			default: 1
		}
	}, {
		name: 'diffuser',
		pin: 10,
		mode: MODE.SOFTPWM,
		type: TYPE.NUMERIC,
		io: IO.OUTPUT,
		options: {
			min: 0,
			max: 100,
			default: 75
		}
	}, {
		name: 'valve',
		pin: 7,
		mode: MODE.DIGITAL,
		type: TYPE.NUMERIC,
		io: IO.OUTPUT,
		options: {
			min: 0,
			max: 1,
			default: 0
		}
	}, {
		name: 'camera',
		pin: 32000,
		mode: MODE.SOCKET,
		type: TYPE.STATE,
		io: IO.OUTPUT,
		options: {
			states: {
				ON: 'start',
				OFF: 'stop'
			},
			default: 'stop'
		}
	}]
};

export default BoardConfig;
