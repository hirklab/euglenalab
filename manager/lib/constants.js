const STATES = {
	CONNECTED: 'connected',
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
}

const MESSAGE = {
	CONNECTED: 'connected',
	DISCONNECTED: 'disconnected',
}

const UNIQUE_ID = 'MANAGER';

const PUBLICATIONS = {
	'BROADCAST': `manager/sent`,
	'MICROSCOPE': `microscopes/__UNIQUE_ID__/inbox`,
	'USER': `users/__USER_ID__/inbox`
}

const SUBSCRIPTIONS = {
	'MICROSCOPE': `microscopes/+/sent`,
	'USER': `users/+/sent`,
};

export {
	STATES,
	QOS,
	MESSAGE,
	EVENTS,
	PUBLICATIONS,
	SUBSCRIPTIONS,
	UNIQUE_ID
};