module.exports = {
	LOG_LEVELS:      ['log', 'trace', 'debug', 'info', 'warn', 'error'],
	EVENTS:          {
		CONNECT:        'connection',
		DISCONNECT:     'disconnect',
		RECONNECT:      'reconnect',
		CLOSE:          'close',
		OFFLINE:        'offline',
		ERROR:          'error',
		MESSAGE:        'message'
	},
	CLIENT_MESSAGES: {
		CONNECTED:         'connection',
		STATUS:            'status',
		CONFIRMATION:      'confirmation',
		LIVE:              'live',
		EXPERIMENT_SET:    'experimentSet',
		EXPERIMENT_CANCEL: 'experimentCancel',
		STIMULUS:          'stimulus',
		MAINTENANCE:       'maintenance',
		DISCONNECTED:      'disconnect',
		ERROR:             'error'
	}
};