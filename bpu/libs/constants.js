var MACHINE            = process.env.MACHINE;
module.exports.IS_FAKE = (MACHINE !== 'raspberrypi');

module.exports.UNIQUE_ID = process.env.UNIQUE_ID || 'DEVICE_MISSING_UNIQUE_ID';

module.exports.STATES = {
	CONNECTING:  'connecting',
	IDLE:        'idle',
	QUEUED:      'queued',
	RUNNING:     'running',
	MAINTENANCE: 'maintenance',
	OFFLINE:     'offline'
};

module.exports.EVENTS = {
	CONNECT:        'connect',
	DISCONNECT:     'disconnect',
	RECONNECT:      'reconnect',
	CLOSE:          'close',
	OFFLINE:        'offline',
	ERROR:          'error',
	MESSAGE:        'message',
	PACKET_SEND:    'packetsend',
	PACKET_RECEIVE: 'packetreceive'
};

module.exports.MESSAGES = {
	CONNECTED:         'connected',
	STATUS:            'status',
	EXPERIMENT_SET:    'experimentSet',
	EXPERIMENT_CANCEL: 'experimentCancel',
	EXPERIMENT_RUN:    'experimentRun',
	STIMULUS:          'stimulus',
	EXPERIMENT_CLEAR:  'experimentClear',
	MAINTENANCE:       'maintenance',
	DISCONNECTED:      'disconnected'
};

module.exports.EXPERIMENT_STATUS = {
	QUEUED:    'initializing', //when queued experiment is about to start
	RUNNING:   'running', //when experiment is in progress
	EXECUTED:  'executed', //when experiment has successfully captured stimulus for its duration
	FAILED:    'failed', //when experiment fails in any of the above steps
	CANCELLED: 'cancelled' //when experiment is explicitly stopped in the middle by the user
};

module.exports.EXPERIMENT_TYPE = {
	LIVE:  'live',
	BATCH: 'batch'
};

module.exports.LOG_LEVELS = ['log', 'trace', 'debug', 'info', 'warn', 'error']