module.exports = {
    LOG_LEVELS: ['log', 'trace', 'debug', 'info', 'warn', 'error'],
    PROFILERS:  ['scripterPopulation', 'scripterActivity', 'scripterResponse'],
	BPU_STATES : {
		CONNECTING:  'connecting',
		IDLE:        'idle',
		QUEUED:      'queued',
		RUNNING:     'running',
		MAINTENANCE: 'maintenance',
		OFFLINE:     'offline'
	},
	BPU_EVENTS : {
		CONNECT:        'connect',
		DISCONNECT:     'disconnect',
		RECONNECT:      'reconnect',
		CLOSE:          'close',
		OFFLINE:        'offline',
		ERROR:          'error',
		MESSAGE:        'message',
		PACKET_SEND:    'packetsend',
		PACKET_RECEIVE: 'packetreceive'
	},
    BPU_MESSAGES : {
	    CONNECTED:         'connected',
	    STATUS:            'status',
	    EXPERIMENT_SET:    'experimentSet',
	    EXPERIMENT_CANCEL: 'experimentCancel',
	    EXPERIMENT_RUN:    'experimentRun',
	    STIMULUS:          'stimulus',
	    EXPERIMENT_CLEAR:  'experimentClear',
	    MAINTENANCE:       'maintenance',
	    DISCONNECTED:      'disconnected'
    }
};