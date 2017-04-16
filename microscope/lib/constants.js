import env from 'dotenv';
env.config();

const UNIQUE_ID = process.env.UNIQUE_ID || 'DEVICE_MISSING_UNIQUE_ID';

const STATES = {
	CONNECTING: 'connecting',
	IDLE: 'idle',
	QUEUED: 'queued',
	RUNNING: 'running',
	MAINTENANCE: 'maintenance',
	OFFLINE: 'offline',
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
	'SENT': `microscopes/${UNIQUE_ID}/sent`
};

const SUBSCRIPTIONS = {
	'MANAGER': `manager/sent`,
	'INBOX': `microscopes/${UNIQUE_ID}/inbox`,
};

const EXPERIMENT = {
	QUEUED: 'initializing', //when queued experiment is about to start
	RUNNING: 'running', //when experiment is in progress
	EXECUTED: 'executed', //when experiment has successfully captured stimulus for its duration
	FAILED: 'failed', //when experiment fails in any of the above steps
	CANCELLED: 'cancelled' //when experiment is explicitly stopped in the middle by the user
}

const EXPERIMENT_TYPE = {
	LIVE: 'live',
	BATCH: 'batch'
}

export {
	STATES,
	QOS,
	MESSAGE,
	EVENTS,
	PUBLICATIONS,
	SUBSCRIPTIONS,
	UNIQUE_ID,
	EXPERIMENT,
	EXPERIMENT_TYPE
};