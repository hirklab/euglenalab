'use strict';

exports = module.exports = function (app, mongoose) {
	var schema = new mongoose.Schema({
		experiment: {
			type: mongoose.Schema.Types.ObjectId,
			ref:  'Experiment'
		},
		user:       {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		data:       {type: String, default: ''}
	});

	schema.plugin(require('./plugins/pagedFind'));
	schema.plugin(require('./plugins/timestamps'));

	schema.index({createdAt: 1});

	schema.set('autoIndex', app.config.isDevelopment);

	app.db.model('Note', schema);
};
