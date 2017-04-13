import config from './env';
import redisServer from 'redis';

//todo use host and port
const redis = redisServer.createClient();

export default redis;
