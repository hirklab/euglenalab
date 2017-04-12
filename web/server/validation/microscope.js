import Joi from 'joi';

export default {
	create: {
		body: {
			name: Joi.string().required(),
			identification: Joi.string(),
		}
	},

	update: {
		body: {
			name: Joi.string().required(),
			identification: Joi.string(),
		}
	},
};