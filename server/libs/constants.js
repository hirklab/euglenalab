var env = require('dotenv');
env.config();

module.exports = {
    LOG_LEVELS: ['log', 'trace', 'debug', 'info', 'warn', 'error'],

    // todo get rid of these profilers
    PROFILERS: ['scripterPopulation', 'scripterActivity', 'scripterResponse'],

    EXPERIMENT_TYPE: {
        LIVE: 'live',
        BATCH: 'batch'
    },
    EVENTS: {
        CONNECT: 'connection',
        DISCONNECT: 'disconnect',
        RECONNECT: 'reconnect',
        CLOSE: 'close',
        OFFLINE: 'offline',
        ERROR: 'error',
        MESSAGE: 'message'
    },

    CLIENT_MESSAGES: {
        RX: {
            EXPERIMENT_SET: 'experimentSet',
            EXPERIMENT_CANCEL: 'experimentCancel', // can be shifted to experiments page
            EXPERIMENT_CONFIRMATION: 'experimentConfirmation',
            EXPERIMENT_EXTEND_DURATION: 'experimentExtendDuration',
            EXPERIMENT_TRANSFER_CONTROL: 'experimentTransferControl',
            STIMULUS: 'stimulus',
            MAINTENANCE: 'maintenance'
        },
        TX: {
            CONNECTED: 'connected',
            STATUS: 'status',
            EXPERIMENT_CONFIRM: 'experimentConfirm',
            EXPERIMENT_LIVE: 'experimentLive',
            DISCONNECTED: 'disconnected'
        }
    },

    CONTROLLER_MESSAGES: {
        TX: {
            EXPERIMENT_SET: 'experimentSet',
            EXPERIMENT_CANCEL: 'experimentCancel', // can be shifted to experiments page
            EXPERIMENT_CONFIRMATION: 'experimentConfirmation',
            EXPERIMENT_EXTEND_DURATION: 'experimentExtendDuration',
            EXPERIMENT_TRANSFER_CONTROL: 'experimentTransferControl',
            STIMULUS: 'stimulus',
            MAINTENANCE: 'maintenance'
        },
        RX: {
            CONNECTED: 'connected',
            STATUS: 'status',
            EXPERIMENT_CONFIRM: 'experimentConfirm',
            EXPERIMENT_LIVE: 'experimentLive',
            DISCONNECTED: 'disconnected'
        }
    },

	BPU_MESSAGES: {
		RX: {
			CONNECTED:    'connected',
			STATUS:       'status',
			DISCONNECTED: 'disconnected'
		},
		TX: {
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
	}
};
