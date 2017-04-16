import mqtt from 'mqtt';
import * as _ from 'lodash';
import logger from './logging';
import {
	STATES,
	SOURCE,
	QOS,
	MESSAGE,
	EVENTS,
	PUBLICATIONS,
	SUBSCRIPTIONS,
	UNIQUE_ID
} from './constants';


class Manager {
	constructor(url, hid) {
		this.url = url;

		this.state = {};
		this.state.hid = hid;
		this.state.status = STATES.CONNECTING;
		this.state.microscopes = {};
	}

	status() {
		return this.state;
	}

	isAvailable() {
		return (this.state.status === STATES.IDLE);
	}

	isRunning() {
		return (this.state.status === STATES.RUNNING);
	}

	isQueued() {
		return (this.state.status === STATES.QUEUED);
	}

	getMicroscopes(){
	    return _.values(this.state.microscopes);
    }

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
				topic: PUBLICATIONS.BROADCAST,
				payload: this.died(),
				qos: QOS.ATLEAST_ONCE,
				retain: false
			},
		};

		this.client = mqtt.connect(this.url, options);

		this.client.on(EVENTS.CONNECT, (connack) => {
			logger.info(`** connected ${this.url} **`);

			if (!connack.sessionPresent) {
				this.client.subscribe(SUBSCRIPTIONS.MICROSCOPE, {
					qos: QOS.ATLEAST_ONCE
				});

				this.client.subscribe(SUBSCRIPTIONS.USER, {
					qos: QOS.ATLEAST_ONCE
				});


				this.client.on(EVENTS.MESSAGE, this.handleMessage.bind(this));
				this.client.on(EVENTS.ERROR, this.handleError.bind(this));
			}

			this.state.connected = 1;
			this.state.status = STATES.RUNNING;

			this.broadcast(MESSAGE.CONNECTED, this.status());
		});
	}

	//===== MQTT RESPOND EVENTS ==============
	onConnected(payload) {
		logger.debug(`=== onConnected ===`);
        this.updateStatus(payload)
	}

	onStatus(payload) {
		logger.debug(`=== onStatus ===`);
        this.updateStatus(payload)
	}

	onDisconnected(payload) {
		logger.debug(`=== onDisconnected ===`);
        this.updateStatus(payload)
	}

	updateStatus(payload){
        if('hid' in payload){
            let hid = payload['hid'];
            this.state.microscopes[hid] = this.state.microscopes[hid] || {}
            this.state.microscopes[hid] = Object.assign(this.state.microscopes[hid], payload);
        }

        logger.debug(this.state);
    }

	//=========================================

	handleMessage(topic, messageString) {
		let message = JSON.parse(messageString);
		let type = message.type;
		// let source = message.source;
		let payload = message.payload;

        logger.debug('====================================')
		logger.debug(`[RX] ${topic}: ${type}`);
		logger.debug(payload);

		switch (type) {
			case MESSAGE.CONNECTED:
				this.onConnected(payload);
				break;

			case MESSAGE.STATUS:
				this.onStatus(payload);
				break;

				// case MESSAGE.EXPERIMENT_SET:
				// 	this.onExperimentSet(payload);
				// 	break;

				// case MESSAGE.EXPERIMENT_CANCEL:
				// 	this.onExperimentCancel(payload);
				// 	break;

				// case MESSAGE.EXPERIMENT_RUN:
				// 	this.onExperimentRun(payload);
				// 	break;

				// case MESSAGE.STIMULUS:
				// 	this.onStimulus(payload);
				// 	break;

				// case MESSAGE.EXPERIMENT_CLEAR:
				// 	this.onExperimentClear(payload);
				// 	break;

				// case MESSAGE.MAINTENANCE:
				// 	this.onMaintenance(payload);
				// 	break;

			case MESSAGE.DISCONNECTED:
				this.onDisconnected(payload);
				break;

			default:
				logger.warn(`invalid message: message type not handled`);
				break;
		}
	}

	// handleMicroscope(type, payload){
    //
	// }
    //
	// handleUser(type,payload){
    //
	// }

	handleError(err) {
		logger.error(`[RX] ${err}`)
	}

    broadcast(type, payload) {
        let newMessage = {};
        newMessage.type = type;
        newMessage.payload = payload;

        logger.debug(`[TX => B] ${PUBLICATIONS.BROADCAST}: ${type}`);
        logger.debug(payload);

        this.client.publish(PUBLICATIONS.BROADCAST, JSON.stringify(newMessage), {
            qos: QOS.ATMOST_ONCE
        });
    }

	sendToMicroscope(type, id, payload) {
		let newMessage = {};
		newMessage.type = type;
		newMessage.payload = payload;

		let publication = PUBLICATIONS.MICROSCOPE.replace('__UNIQUE_ID__', id);

		logger.debug(`[TX -> M] ${publication}: ${type}`);
		logger.debug(payload);

		this.client.publish(publication, JSON.stringify(newMessage), {
			qos: QOS.ATMOST_ONCE
		});
	}

	sendToUser(type, id, payload) {
		let newMessage = {};
		newMessage.type = type;
		newMessage.payload = payload;

		let publication = PUBLICATIONS.USER.replace('__USER_ID__', id);

		logger.debug(`[TX -> U] ${publication}: ${type}`);
		logger.debug(payload);

		this.client.publish(publication, JSON.stringify(newMessage), {
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
		// this.onDisconnected();

		let newMessage = {};
		newMessage.type = MESSAGE.DISCONNECTED;
		newMessage.payload = this.state;

		return JSON.stringify(newMessage);
	}
}

export default Manager;