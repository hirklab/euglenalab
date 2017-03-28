import RateLimit from 'express-rate-limit';

let throttle = new RateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes 
	max: 10, // limit each IP to 100 requests per windowMs 
	delayMs: 0, // disable delaying - full speed until the max limit is reached 
	message: `You\'ve reached the maximum number of requests allowed. Please try again later.`
});

export default throttle;