import Joi from 'joi';

export default {
	create: {
		body: {
			category: Joi.string().required(),
		}
	},

	update: {
		body: {
			name: Joi.string().required(),
			description: Joi.string(),
		}
	},
};