import mqtt from 'mqtt';
import logger from './logging';
import Board from './board';
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
		this.hid = hid;

		this.state = {};
		this.state.hid = hid;
		this.state.status = STATES.CONNECTING;

		this.board = new Board();
	}

	status() {
		return this.state;
	}

	//===== MQTT SEND EVENTS =================
	connect() {
		let options = {
			clientId: this.hid,
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

		this.client = mqtt.connect(this.url, options);

		this.client.on(EVENTS.CONNECT, (connack) => {
			logger.info(`** connected ${this.url} **`);

			if (!connack.sessionPresent) {
				this.client.subscribe(SUBSCRIPTIONS.INBOX, {
					qos: QOS.ATMOST_ONCE
				});

				this.client.on(EVENTS.MESSAGE, this.handleMessage);
				this.client.on(EVENTS.ERROR, this.handleError);
			}

			this.state.connected = 1;
			this.state.status = STATES.IDLE;

			// update manager
			this.sendMessage(MESSAGE.CONNECTED, this.status());
		});
	}

	//===== MQTT RESPOND EVENTS ==============
	onConnected(payload) {

	}

	onStatus(payload) {
		this.sendMessage(MESSAGE.CONNECTED, this.status());
	}

	onExperimentSet(payload) {

	}

	onExperimentRun(payload) {

	}

	onStimulus(payload) {

	}

	onExperimentClear(payload) {

	}

	onMaintenance(payload) {

	}

	onDisconnected(payload) {

	}

	//=========================================

	handleMessage(topic, messageString) {
		let message = JSON.parse(messageString);
		let type = message.type;
		let payload = message.payload;

		logger.debug(`>> ${topic}: ${type}`);
		logger.debug(`${payload}`);

		switch (type) {
			case MESSAGE.CONNECTED:
				this.onConnected(payload);
				break;

			case MESSAGE.STATUS:
				this.onStatus(payload);
				break;

			case MESSAGE.EXPERIMENT_SET:
				this.onExperimentSet(payload);
				break;

			case MESSAGE.EXPERIMENT_RUN:
				this.onExperimentRun(payload);
				break;

			case MESSAGE.STIMULUS:
				this.onStimulus(payload);
				break;

			case MESSAGE.EXPERIMENT_CLEAR:
				this.onExperimentClear(payload);
				break;

			case MESSAGE.MAINTENANCE:
				this.onMaintenance(payload);
				break;

			case MESSAGE.DISCONNECTED:
				this.onDisconnected(payload);
				break;

			default:
				logger.warn(`message type not handled`);
				break;
		}
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

	disconnect() {
		this.state.connected = 0;
		// this.client.sendMessage(MESSAGE.DISCONNECTED, this.state);
		this.client.disconnect();

		this.onDisconnected();
	}

	died() {
		this.state.connected = 0;
		this.onDisconnected();

		let newMessage = {};
		newMessage.type = MESSAGE.DISCONNECTED;
		newMessage.payload = this.state;

		return JSON.stringify(newMessage);
	}
}

export default Microscope;