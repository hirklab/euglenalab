const mqtt = require('mqtt');

const UNIQUE_ID = 'HASHED_RANDOM_HARDWARE_ID';

const STATES = {
	CONNECTED: 'connected',
	OFFLINE: 'offline',
};

const CHANNELS = {
	'CONNECTED': 'microscope/${UNIQUE_ID}/connected'
};

const client = mqtt.connect('mqtt://localhost:8083', {
	will: {
		topic: CHANNELS.CONNECTED,
		payload: 'false'
	}
});

client.on('connect', () => {
	console.log('connected');
	client.publish(CHANNELS.CONNECTED, 'true')
})

client.on('message', (topic, message) => {
	console.log('received message %s %s', topic, message)
})