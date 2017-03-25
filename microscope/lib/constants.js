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

const UNIQUE_ID = 'HASHED_RANDOM_HARDWARE_ID';

const PUBLICATIONS = {
	'SENT': `microscopes/${UNIQUE_ID}/sent`
}

const SUBSCRIPTIONS = {
	'INBOX': `microscopes/${UNIQUE_ID}/inbox`,
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