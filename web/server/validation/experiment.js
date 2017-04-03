import Joi from 'joi';

export default {
	create: {
		body: {
      name: Joi.string().required(),
      description: Joi.string()
		}
	},

	update: {
		body: {
      name: Joi.string().required(),
      description: Joi.string(),
		}
	},
};
