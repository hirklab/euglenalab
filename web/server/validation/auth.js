import Joi from 'joi';

export default {
	// POST /api/auth/login
	register: {
		body: {
			username: Joi.string().required(), // /^[a-zA-Z0-9\-\_]+$/
			email: Joi.string().required(), // /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/
			password: Joi.string().required(),
		}
	},

	// POST /api/auth/login
	login: {
		body: {
			username: Joi.string().required(),
			password: Joi.string().required()
		}
	},

	forgotPassword: {
		body: {
			email: Joi.string().required(), // /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/
		}
	},

	resetPassword: {
		body: {
			email: Joi.string().required(), // /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/
			password: Joi.string().required(),
			confirmPassword: Joi.string().required(),
			token: Joi.string().required(),
		}
	},
};