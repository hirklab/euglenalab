module.exports = {
	LOG_LEVELS:      ['log', 'trace', 'debug', 'info', 'warn', 'error'],
	EVENTS:          {
		CONNECT:    'connection',
		DISCONNECT: 'disconnect',
		RECONNECT:  'reconnect',
		CLOSE:      'close',
		OFFLINE:    'offline',
		ERROR:      'error',
		MESSAGE:    'message'
	},

	// CLIENT_MESSAGES: {
	// 	CONNECTED:         'connection',
	// 	STATUS:            'status',
	// 	CONFIRMATION:      'confirmation',
	// 	LIVE:              'live',
	// 	EXPERIMENT_SET:    'experimentSet',
	// 	EXPERIMENT_CANCEL: 'experimentCancel',
	// 	STIMULUS:          'stimulus',
	// 	MAINTENANCE:       'maintenance',
	// 	DISCONNECTED:      'disconnect',
	// 	ERROR:             'error'
	// },

	CLIENT_MESSAGES : {
		RX:{
			EXPERIMENT_SET: 'experimentSet',
			EXPERIMENT_CANCEL: 'experimentCancel', // can be shifted to experiments page
			EXPERIMENT_CONFIRMATION: 'experimentConfirmation',
			EXPERIMENT_EXTEND_DURATION: 'experimentExtendDuration',
			EXPERIMENT_TRANSFER_CONTROL: 'experimentTransferControl',
			STIMULUS: 'stimulus',
			MAINTENANCE: 'maintenance'
		},
		TX:{
			CONNECTED: 'connected',
			STATUS: 'status',
			EXPERIMENT_CONFIRM: 'experimentConfirm',
			EXPERIMENT_LIVE: 'experimentLive',
			DISCONNECTED: 'disconnected'
		}
	},

	CONTROLLER_MESSAGES : {
		TX:{
			EXPERIMENT_SET: 'experimentSet',
			EXPERIMENT_CANCEL: 'experimentCancel', // can be shifted to experiments page
			EXPERIMENT_CONFIRMATION: 'experimentConfirmation',
			EXPERIMENT_EXTEND_DURATION: 'experimentExtendDuration',
			EXPERIMENT_TRANSFER_CONTROL: 'experimentTransferControl',
			STIMULUS: 'stimulus',
			MAINTENANCE: 'maintenance'
		},
		RX:{
			CONNECTED: 'connected',
			STATUS: 'status',
			EXPERIMENT_CONFIRM: 'experimentConfirm',
			EXPERIMENT_LIVE: 'experimentLive',
			DISCONNECTED: 'disconnected'
		}
	}
};