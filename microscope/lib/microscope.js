import env from 'dotenv';
import mqtt from "mqtt";
import _ from "lodash";
import publicIp from "public-ip";
import internalIp from "internal-ip";
import logger from "./logging";
import Board from "./board";
import {
    STATES,
    QOS,
    MESSAGE,
    EVENTS,
    PUBLICATIONS,
    SUBSCRIPTIONS,
    EXPERIMENT,
    EXPERIMENT_TYPE
} from "./constants";


env.config();

const EXPERIMENT_EVENT_INTERVAL = parseInt(process.env.EXPERIMENT_EVENT_INTERVAL || 20);


class Microscope {
    constructor(url, hid) {
        this.client = null;

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
        return (this.state.status === STATES.IDLE);
    }

    isRunning() {
        return (this.state.status === STATES.RUNNING);
    }

    isQueued() {
        return (this.state.status === STATES.QUEUED);
    }

    getPublicIP() {
        publicIp.v4().then(ip => {
            this.state.publicAddress = {
                ip: ip,
                port: 0,
                cameraPort: 20005
            };

            this.getLocalIP();

            this.sendMessage(MESSAGE.STATUS, this.status());
        });
    }

    getLocalIP() {
        this.state.localAddress = {
            ip: internalIp.v4(),
            port: 0,
            cameraPort: 80
        };

        // this.sendMessage(MESSAGE.STATUS, this.status());
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
                    qos: QOS.ATLEAST_ONCE
                });

                this.client.subscribe(SUBSCRIPTIONS.MANAGER, {
                    qos: QOS.ATLEAST_ONCE
                });

                this.client.on(EVENTS.MESSAGE, this.handleMessage.bind(this));
                this.client.on(EVENTS.ERROR, this.handleError.bind(this));
            }

            this.state.connected = 1;

            if (this.state.status === STATES.CONNECTING) {
                this.state.status = STATES.IDLE;
            }

            this.sendMessage(MESSAGE.STATUS, this.status());

            this.getPublicIP();
        });
    }

    //===== MQTT RESPOND EVENTS ==============
    onConnected(payload) {
        logger.debug(`=== onConnected ===`);
        this.state.connected = 1;

        // do not change state if it was not connecting already
        // it might be some erroneous state that needs some cleanup before it is ready
        if (this.state.status === STATES.CONNECTING) {
            this.state.status = STATES.IDLE;
        }

        this.sendMessage(MESSAGE.STATUS, this.status());
    }

    onStatus(payload) {
        logger.debug(`=== onStatus ===`);
        this.sendMessage(MESSAGE.STATUS, this.status());
    }

    onExperimentSet(payload) {
        logger.debug(`=== onExperimentSet ===`);

        if (this.isAvailable()) {
            //reset board
            this.board.configure();

            this.state.status = STATES.QUEUED;

            let experiment = payload.experiment;
            // todo: create a folder to save 
            //
            // todo: get events to run
            //

            this.state.experiment = experiment;
            this.state.experiment.status = EXPERIMENT.QUEUED;
            this.state.experiment.submittedAt = new Date();
        }
    }

    onExperimentCancel(payload) {
        logger.debug(`=== onExperimentCancel ===`);

        if (this.isQueued()) {
            this.state.experiment.status = EXPERIMENT.CANCELLED;
            this.state.experiment.cancelledAt = new Date();
            // todo save this experiment


            this.state.experiment = null;

            // todo : other cleanup activities
            // 
            // 

            //reset board
            this.board.configure();
            this.state.status = STATES.IDLE;
        }
    }

    onExperimentRun(payload) {
        logger.debug(`=== onExperimentRun ===`);

        if (this.isAvailable()) {
            this.state.status = STATES.RUNNING;

            // type of experiment
            if (this.state.experiment.category == EXPERIMENT_TYPE.LIVE) {
                this.state.allowStimulus = 1;
            }

            this.state.experiment.status = EXPERIMENT.RUNNING;
            // todo save this experiment
            // 
            // batch: prepare events and execute
            // 

            // turn on the camera recorder
            this.board.startRecording();

            this.state.experiment.startedAt = new Date();

            let startedAt = this.state.experiment.startedAt.getTime(); // duration in seconds
            let shouldFinishAt = new Date(this.state.experiment.startedAt.getTime() + this.state.experiment.duration * 1000); // duration in seconds

            var loop = setInterval(() => {
                var timeNow = new Date();
                var timeLeft = Math.abs(shouldFinishAt.getTime() - timeNow.getTime());

                var event = this.state.experiment.proposedEvents.shift();
                this.onExecuteEvent(event);

                if (timeLeft <= 0) {
                    clearInterval(loop);

                    this.board.stopRecording();
                }
            }, EXPERIMENT_EVENT_INTERVAL);


        }
    }

    onStimulus(payload) {
        logger.debug(`=== onStimulus ===`);

        if (this.isRunning()) {

            if ('event' in payload) {
                this.onExecuteEvent(payload.event);

                // todo save this experiment
            }
        }
    }

    onExecuteEvent(event) {
        let devices = event;
        let currentTime = new Date();

        _.each(devices, (device) => {
            this.board.setDevice(device.name, device.value);
        });

        this.state.experiment.actualEvents.push({
            time: currentTime,
            event: event
        });
    }

    onExperimentClear(payload) {
        logger.debug(`=== onExperimentClear ===`);

        if (this.isRunning()) {
            this.state.experiment.status = EXPERIMENT.EXECUTED;
            this.state.experiment.completedAt = new Date();
            // todo save this experiment
            // 

            // todo : other cleanup activities

            //reset board
            this.board.configure();
            this.state.experiment = null;
            this.state.allowStimulus = 0;
            this.state.status = STATES.IDLE;

        }
    }

    onMaintenance(payload) {
        logger.debug(`=== onMaintenance ===`);

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
        logger.debug(`=== onDisconnected ===`);

        //reset board
        // this.board.configure();
    }

    //=========================================

    handleMessage(topic, messageString) {
        let message = JSON.parse(messageString);
        let type = message.type;
        let payload = message.payload;

        logger.debug('====================================');
        logger.debug(`[RX] ${topic}: ${type}`);
        logger.debug(payload);

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

            case MESSAGE.EXPERIMENT_CANCEL:
                this.onExperimentCancel(payload);
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
                logger.warn(`invalid message: message type not handled`);
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