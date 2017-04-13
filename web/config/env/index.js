import env from 'dotenv';
import path from 'path';

env.config();

const environ = process.env.NODE_ENV;

const defaults = {
	env: environ,
	root: path.join(__dirname, '/..'),
	logging: {
		level: process.env.LOG_LEVEL,
		morgan: environ != 'development',
		winston: environ != 'test',
		stacktrace: environ != 'production'
	},
	server: {
		domain: process.env.DOMAIN,
		port: process.env.PORT
	},
	project: {
		name: 'Interactive Biology Lab',
		version: '1.0.0',
		organization: `Riedel-Kruse Lab, Stanford University`,
	},
	database: {
		url: process.env.DATABASE_URL + process.env.DATABASE_NAME,
		name: process.env.DATABASE_NAME,
		debug: environ == 'development',
	},
  redis:{
	  host:'localhost',
	  port:6379
  },
	auth: {
		jwtSecret: process.env.JWT_SECRET,
		requireAccountVerification: false,
		loginUrl: '#/pages/auth/login',
		resetPasswordUrl: '#/pages/auth/reset-password',
	},
	experiment: {
		duration: parseInt(process.env.EXPERIMENT_DURATION)
	},
	smtp: {
		from: {
			name: '[Interactive Biology Lab]',
			address: process.env.EMAIL_USERNAME
		},
		credentials: {
			username: process.env.EMAIL_USERNAME,
			password: process.env.EMAIL_PASSWORD,
			host: process.env.EMAIL_HOST,
			ssl: process.env.EMAIL_SSL == "true"
		}
	}
};

export default defaults;
