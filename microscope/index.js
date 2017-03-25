import env from 'dotenv';
import logger from './lib/logging';
import Microscope from './lib/microscope';
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

let microscope = new Microscope(MQTT_BROKER_URL, UNIQUE_ID);