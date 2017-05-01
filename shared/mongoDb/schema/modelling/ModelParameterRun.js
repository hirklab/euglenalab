"use strict";
exports = module.exports = function(app, mongoose) {
	var theSchema = new mongoose.Schema({
		modelParameter: {
			id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ModelParameters'
			},
		},
		stopImageId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Image'
		},

		startRealTime: {
			type: Number,
			default: -1
		},
		stopRealTime: {
			type: Number,
			default: -1
		},

	});
	app.db.model('ModelParameterRun', theSchema);
};