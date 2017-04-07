import mqtt from "mqtt";
import _ from "lodash";
import logger from "./logging";
import Board from "./board";
import {STATES, QOS, MESSAGE, EVENTS, PUBLICATIONS, SUBSCRIPTIONS} from "./constants";


class Microscope {
    constructor(url, hid) {
        this.url = url;
        this.hid = hid;

        this.state = {};
        this.state.hid = hid;
        this.state.status = STATES.CONNECTING;

        this.board = new Board();
        this.board.configure();
    }

    status() {
        return this.state;
    }

    isAvailable() {
        return (this.state.status == STATES.IDLE);
    }

    isRunning() {
        return (this.state.status == STATES.RUNNING);
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

            this.onConnected();

            // update manager
            this.sendMessage(MESSAGE.CONNECTED, this.status());
        });
    }

    //===== MQTT RESPOND EVENTS ==============
    onConnected(payload) {
        logger.info(`onConnected`);
        this.state.connected = 1;

        // do not change state if it was not connecting already
        // it might be some erroneous state that needs some cleanup before it is ready
        if (this.state.status == STATES.CONNECTING) {
            this.state.status = STATES.IDLE;
        }
    }

    onStatus(payload) {
        logger.info(`onStatus`);
        this.sendMessage(MESSAGE.STATUS, this.status());
    }

    onExperimentSet(payload) {
        logger.info(`onExperimentSet`);

        if (this.isAvailable()) {
            //reset board
            this.board.configure();
        }


    }

    onExperimentRun(payload) {
        logger.info(`onExperimentRun`);

        if (this.isAvailable()) {
            this.state.status = STATES.RUNNING;
        }
    }

    onStimulus(payload) {
        logger.info(`onStimulus`);

        if (this.isRunning()) {
            if ('devices' in payload) {
                let devices = payload.devices;

                _.each(devices, (device) => {
                    this.board.setDevice(device.name, device.value);
                });
            }
        }
    }

    onExperimentClear(payload) {
        logger.info(`onExperimentClear`);

        if (this.isRunning()) {
            //reset board
            this.board.configure();
            this.state.status = STATES.IDLE;
        }
    }

    onMaintenance(payload) {
        logger.info(`onMaintenance`);

        if (this.isAvailable()) {
            let duration = 1;

            this.state.status = STATES.MAINTENANCE;

            if ('devices' in payload) {
                let devices = payload.devices;

                _.each(devices, (device) => {
                    this.board.setDevice(device.name, device.value);
                });
            }

            if ('flush' in payload) {
                let flush = payload.flush;
                this.board.flush(flush.duration);
                duration = flush.duration;
            }

            setTimeout(() => {
                this.state.status = STATES.IDLE;
            }, duration);
        }
    }

    onDisconnected(payload) {
        logger.info(`onDisconnected`);

        //reset board
        this.board.configure();
    }

    //=========================================

    handleMessage(topic, messageString) {
        let message = JSON.parse(messageString);
        let type = message.type;
        let payload = message.payload;

        logger.debug(`[RX] ${topic}: ${type}`);
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
        logger.error(`[RX] ${err}`)
    }

    sendMessage(type, payload) {
        let newMessage = {};
        newMessage.type = type;
        newMessage.payload = payload;

        logger.debug(`[TX] ${PUBLICATIONS.SENT}: ${type}`);
        logger.debug(payload);

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
        // this.onDisconnected();

        let newMessage = {};
        newMessage.type = MESSAGE.DISCONNECTED;
        newMessage.payload = this.state;

        return JSON.stringify(newMessage);
    }
}

export default Microscope;