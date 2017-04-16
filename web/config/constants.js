import env from 'dotenv';
env.config();

const UNIQUE_ID = process.env.UNIQUE_ID || 'MANAGER';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;

const STATES = {
  CONNECTING: 'connecting',
  RUNNING: 'running',
  OFFLINE: 'offline',
};

const SOURCE = {
  MICROSCOPE: 'microscope',
  USER: 'user',
};

const QOS = {
  ATMOST_ONCE: 0,
  ATLEAST_ONCE: 1,
  EXACTLY_ONCE: 2
};

const EVENTS = {
  CONNECT: 'connect',
  RECONNECT: 'reconnect',
  CLOSE: 'close',
  OFFLINE: 'offline',
  ERROR: 'error',
  MESSAGE: 'message',
  PACKET_SEND: 'packetsend',
  PACKET_RECEIVE: 'packetreceive'
};

const MESSAGE = {
  CONNECTED: 'connected',
  STATUS: 'status',
  EXPERIMENT_SET: 'experimentSet',
  EXPERIMENT_CANCEL: 'experimentCancel',
  EXPERIMENT_RUN: 'experimentRun',
  STIMULUS: 'stimulus',
  EXPERIMENT_CLEAR: 'experimentClear',
  MAINTENANCE: 'maintenance',
  DISCONNECTED: 'disconnected',
};

const PUBLICATIONS = {
  'BROADCAST': `manager/sent`,
  'MICROSCOPE': `microscopes/__UNIQUE_ID__/inbox`,
  'USER': `users/__USER_ID__/inbox`
};

const SUBSCRIPTIONS = {
  'MICROSCOPE': `microscopes/+/sent`,
  'USER': `users/+/sent`,
};

const EXPERIMENT = {
  SUBMITTED: 'submitted', //when user reserves an experiment
  QUEUED: 'queued', //when reserved experiment is waiting in queue
  INITIALIZING: 'initializing', //when queued experiment is about to start
  RUNNING: 'running', //when experiment is in progress
  EXECUTED: 'executed', //when experiment has successfully captured stimulus for its duration
  PROCESSING: 'processing', //when experiment is pushed for processing the stimulus and response data
  FINISHED: 'finished', //when experiment data has been processing and ready for download
  FAILED: 'failed', //when experiment fails in any of the above steps
  CANCELLED: 'cancelled' //when experiment is explicitly stopped in the middle by the user
};

const EXPERIMENT_TYPE = {
  LIVE: 'live',
  BATCH: 'batch'
};

export {
  MQTT_BROKER_URL,
  STATES,
  SOURCE,
  QOS,
  MESSAGE,
  EVENTS,
  PUBLICATIONS,
  SUBSCRIPTIONS,
  UNIQUE_ID,
  EXPERIMENT,
  EXPERIMENT_TYPE
};
