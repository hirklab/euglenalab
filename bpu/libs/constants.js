var os  = require('os');
var env = require('dotenv');
env.config();

var MACHINE            = process.env.MACHINE || 'ubuntu';
var IS_FAKE            = (MACHINE !== 'raspberrypi');
module.exports.IS_FAKE = IS_FAKE;

var NAME                   = process.env.NAME || 'DEVICE_MISSING_NAME';
module.exports.NAME        = NAME;
module.exports.UNIQUE_ID   = process.env.UNIQUE_ID || 'DEVICE_MISSING_UNIQUE_ID';
module.exports.IP          = process.env.IP || '127.0.0.1';
module.exports.PORT        = process.env.PORT || '8090';
module.exports.CAMERA_PORT = process.env.CAMERA_PORT || '8080';

var HOME_DIR = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

var DATA = {
	ROOT:    HOME_DIR + '/bpuData',
	EXPERIMENT:     HOME_DIR + '/bpuData/tempExpData',
	MOUNTED: (IS_FAKE ? HOME_DIR + '/bpuEuglenaData/' + NAME.toLowerCase() : '/mnt/bpuEuglenaData/' + NAME.toLowerCase())
};

module.exports.DATA = DATA;

module.exports.STATES = {
	CONNECTING:  'connecting',
	IDLE:        'idle',
	QUEUED:      'queued',
	RUNNING:     'running',
	MAINTENANCE: 'maintenance',
	OFFLINE:     'offline'
};

module.exports.EVENTS = {
	CONNECT:        'connection',
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

module.exports.LOG_LEVELS = ['log', 'trace', 'debug', 'info', 'warn', 'error'];