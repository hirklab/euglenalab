import mqtt from 'mqtt';
import * as _ from 'lodash';
import logger from './logging';
import models from '../server/models';
import {
  STATES,
  SOURCE,
  QOS,
  MESSAGE,
  EVENTS,
  PUBLICATIONS,
  SUBSCRIPTIONS,
  UNIQUE_ID,
  MQTT_BROKER_URL
} from './constants';


class Manager {
  constructor(url, hid) {
    this.url = url;

    this.state = {};
    this.state.hid = hid;
    this.state.status = STATES.CONNECTING;
    this.state.microscopes = {};
    this.experiments = [];
  }

  status() {
    return this.state;
  }

  isAvailable() {
    return (this.state.status === STATES.IDLE);
  }

  getMicroscopes() {
    return _.values(this.state.microscopes);
  }

  connect(io) {
    let options = {
      clientId: this.state.hid,
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
    this.io = io;

    this.client.on(EVENTS.CONNECT, (connack) => {
      logger.info(`** connected ${this.url} **`);

      if (!connack.sessionPresent) {
        this.client.subscribe(SUBSCRIPTIONS.MICROSCOPE, {
          qos: QOS.ATLEAST_ONCE
        });

        // this.client.subscribe(SUBSCRIPTIONS.USER, {
        //   qos: QOS.ATLEAST_ONCE
        // });


        this.client.on(EVENTS.MESSAGE, this.handleMessage.bind(this));
        this.client.on(EVENTS.ERROR, this.handleError.bind(this));
      }

      this.state.connected = 1;
      this.state.status = STATES.RUNNING;

      this.broadcast(MESSAGE.CONNECTED, this.status());
    });
  }

  updateStatus(payload) {
    if ('hid' in payload) {
      let hid = payload['hid'];

      this.state.microscopes[hid] = this.state.microscopes[hid] || {};
      this.state.microscopes[hid] = Object.assign(this.state.microscopes[hid], payload);

      models.Microscope
        .getOrCreate(hid, this.state.microscopes[hid])
        .then((microscope) => {
          this.state.microscopes[hid] = Object.assign(this.state.microscopes[hid], microscope); // eslint-disable-line no-param-reassign
          logger.debug(microscope);
        })
        .catch(e => logger.error(e));
    }

    logger.debug(this.state);
  }

  addExperiment(experiment) {
    logger.debug(`=== addExperiment ===`);
    logger.debug(experiment);

    // push to list pending assignment
    this.experiments.push(experiment);

    _.each(this.experiments, function(experiment) {

      if (experiment && experiment.proposedMicroscope) {
        this.state.microscopes[hid].experiments = this.state.microscopes[hid].experiments || [];
        this.state.microscopes[hid].experiments.push(experiment);
      } else {
        //find best microscope with least wait time and highest rating
        let microscopes = _.sortBy(_.values(this.state.microscopes), [function(o) {
          let internalRating = o.internalRating == 0 ? 1 : o.internalRating;
          let waitTime = o.waitTime == 0 ? 1 : o.waitTime;

          return waitTime / internalRating;
        }]);

        if (microscopes && microscopes.length > 0) {
          microscopes[0].experiments.push(experiment);
        }
      }

    });

  }

  updateMicroscopes() {

  }

  updateUsers() {

  }

  //===== MQTT RESPOND EVENTS ==============
  onConnected(payload) {
    logger.debug(`=== onConnected ===`);
    this.updateStatus(payload)
  }

  onStatus(payload) {
    logger.debug(`=== onStatus ===`);
    this.updateStatus(payload);

    this.io.emit('message', {
      type: 'status',
      payload: payload
    });
  }

  onExperimentSet(payload) {
    logger.debug(`=== onExperimentSet ===`);

  }

  onExperimentCancel(payload) {
    logger.debug(`=== onExperimentCancel ===`);
  }

  onExperimentRun(payload) {
    logger.debug(`=== onExperimentRun ===`);
  }

  onStimulus(payload) {
    logger.debug(`=== onStimulus ===`);
  }

  onExperimentClear(payload) {
    logger.debug(`=== onExperimentClear ===`);
  }

  onMaintenance(payload) {
    logger.debug(`=== onMaintenance ===`);
  }

  onDisconnected(payload) {
    logger.debug(`=== onDisconnected ===`);
    this.updateStatus(payload)

    this.io.emit('message', {
      type: 'status',
      payload: payload
    });
  }



  //=========================================

  handleMessage(topic, messageString) {
    let message = JSON.parse(messageString);
    let type = message.type;
    // let source = message.source;
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

function Singleton() {
  this.instance = null;
  this.getInstance = function getInstance() {
    if (!this.instance) {
      this.instance = new Manager(MQTT_BROKER_URL, UNIQUE_ID);
      // this.instance.connect();
    }
    return this.instance;
  }
}

let singleton = new Singleton();

export default singleton.getInstance();