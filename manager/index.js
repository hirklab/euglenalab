import env from 'dotenv';
import logger from './lib/logging';
import Manager from './lib/manager';
import {
	STATES,
	QOS,
	MESSAGE,
	EVENTS,
	PUBLICATIONS,
	SUBSCRIPTIONS,
	UNIQUE_ID,
    MQTT_BROKER_URL
} from './lib/constants';

env.config();

let manager = new Manager(MQTT_BROKER_URL, UNIQUE_ID);
manager.connect();