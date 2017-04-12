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
	UNIQUE_ID
} from './lib/constants';

env.config();

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;

let manager = new Manager(MQTT_BROKER_URL, UNIQUE_ID);
manager.connect();