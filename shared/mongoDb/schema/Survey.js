'use strict';

exports = module.exports = function(app, mongoose) {
	var surveySchema = new mongoose.Schema({
		rating: {
			type: Number,
			default: 0
		},
		notes: {
			type: String,
			default: ''
		},
		experiment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'BPUExperiment'
		}
	});
	app.db.model('Survey', surveySchema);
};