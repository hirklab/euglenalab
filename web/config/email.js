import config from './env';
import nodemailer from 'nodemailer';

let emailer = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: config.smtp.credentials.username,
		pass: config.smtp.credentials.password
	}
});

export default emailer;