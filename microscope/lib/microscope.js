import mqtt from 'mqtt';
import logger from './logging';
import {
	STATES,
	QOS,
	MESSAGE,
	EVENTS,
	PUBLICATIONS,
	SUBSCRIPTIONS,
	UNIQUE_ID
} from './constants';


class Microscope {
	constructor(url, hid) {
		this.url = url;

		this.state = {};
		this.state.hid = hid;

		let options = {
			clientId: hid,
			protocol: "mqtt",
			protocolId: "MQTT",
			protocolVersion: 4,
			keepalive: 60,
			clean: true,
			reconnect: 10,
			reconnectPeriod: 2000,
			connectTimeout: 20000,
			logger: 'all',
			// key: fs.readFileSync("./keys/key.pem"),
			// cert: fs.readFileSync("./keys/cert.pem"),
			rejectUnauthorized: false,
			will: {
				topic: PUBLICATIONS.SENT,
				payload: this.died(),
				qos: QOS.ATLEAST_ONCE,
				retain: false
			},
		};

		this.client = mqtt.connect(url, options);

		this.client.on(EVENTS.CONNECT, (connack) => {
			logger.info(`** connected ${this.url} **`);
			this.state.connected = 'true';

			if (!connack.sessionPresent) {
				this.client.subscribe(SUBSCRIPTIONS.INBOX, {
					qos: QOS.ATMOST_ONCE
				});


				this.client.on(EVENTS.MESSAGE, this.handleMessage);
				this.client.on(EVENTS.ERROR, this.handleError);
			}

			this.connect();
		});
	}

	connect() {
		this.state.connected = 'true';
		this.sendMessage(MESSAGE.CONNECTED, this.state);
	}

	handleMessage(topic, messageString) {
		let message = JSON.parse(messageString);
		let type = message.type;
		let payload = message.payload;

		logger.debug(`>> ${topic}: ${type}`);
		logger.debug(`${payload}`);
	}

	handleError(err) {
		logger.error(`>> ${err}`)
	}

	sendMessage(type, message) {
		let newMessage = {};
		newMessage.type = type;
		newMessage.payload = message;

		this.client.publish(PUBLICATIONS.SENT, JSON.stringify(newMessage), {
			qos: QOS.ATMOST_ONCE
		});
	}

	status() {
		return this.state;
	}

	disconnect() {
		this.state.connected = 'false';
		// this.client.sendMessage(MESSAGE.DISCONNECTED, this.state);
		this.client.disconnect();
	}

	died() {
		this.state.connected = 'false';

		let newMessage = {};
		newMessage.type = MESSAGE.DISCONNECTED;
		newMessage.payload = this.state;

		return JSON.stringify(newMessage);
	}
}

export default Microscope;