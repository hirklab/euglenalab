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


class Manager {
	constructor(url) {
		this.url = url;

		this.state = {};
		this.state.hid = UNIQUE_ID;

		let options = {
			clientId: UNIQUE_ID,
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
				topic: PUBLICATIONS.BROADCAST,
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
				this.client.subscribe(SUBSCRIPTIONS.MICROSCOPE, {
					qos: QOS.ATMOST_ONCE
				});

				this.client.subscribe(SUBSCRIPTIONS.USER, {
					qos: QOS.ATMOST_ONCE
				});


				this.client.on(EVENTS.MESSAGE, this.handleMessage);
				this.client.on(EVENTS.ERROR, this.handleError);
			}

			this.connect();
		});
	}

	connect() {
		this.state.connected = 1;
		// this.broadcast(MESSAGE.CONNECTED, this.state);
		this.broadcast(MESSAGE.STATUS, this.state);
	}

	handleMessage(topic, messageString) {
		let message = JSON.parse(messageString);
		let type = message.type;
		let payload = message.payload;

		logger.debug(`[RX] ${topic}: ${type}`);
		logger.debug(payload);


	}

	handleError(err) {
		logger.error(`[RX] ${err}`)
	}

	broadcast(type, payload) {
		let newMessage = {};
		newMessage.type = type;
		newMessage.payload = payload;

        logger.debug(`[TX] ${PUBLICATIONS.BROADCAST}: ${type}`);
        logger.debug(payload);

		this.client.publish(PUBLICATIONS.BROADCAST, JSON.stringify(newMessage), {
			qos: QOS.ATMOST_ONCE
		});
	}

	sendMicroscope(type, microscopeId, payload) {
		let newMessage = {};
		newMessage.type = type;
		newMessage.payload = payload;

		let publication = PUBLICATIONS.MICROSCOPE.replace('__UNIQUE_ID__',microscopeId);

        logger.debug(`[TX] ${publication}: ${type}`);
        logger.debug(payload);

		this.client.publish(publication, JSON.stringify(newMessage), {
			qos: QOS.ATMOST_ONCE
		});
	}

	sendUser(type, userId, payload) {
		let newMessage = {};
		newMessage.type = type;
		newMessage.payload = payload;

        let publication = PUBLICATIONS.USER.replace('__USER_ID__',userId);

        logger.debug(`[TX] ${publication}: ${type}`);
        logger.debug(payload);

		this.client.publish(publication, JSON.stringify(newMessage), {
			qos: QOS.ATMOST_ONCE
		});
	}

	status() {
		return this.state;
	}

	disconnect() {
		this.state.connected = 0;
		// this.client.sendMessage(MESSAGE.DISCONNECTED, this.state);
		this.client.disconnect();
	}

	died() {
		this.state.connected = 1;

		let newMessage = {};
		newMessage.type = MESSAGE.DISCONNECTED;
		newMessage.payload = this.state;

		return JSON.stringify(newMessage);
	}
}

export default Manager;