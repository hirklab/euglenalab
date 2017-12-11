'use strict';

exports.create = function(req, res) {
	var workflow = req.app.utility.workflow(req, res);

	workflow.on('validate', function() {
		if (!req.body.experiment) {
			workflow.outcome.errfor.experiment = 'required';
		}
		
		if (!req.body.activity) {
			workflow.outcome.errfor.activity = 'required';
		}

		if (!req.body.population) {
			workflow.outcome.errfor.population = 'required';
		}

		if (!req.body.response) {
			workflow.outcome.errfor.response = 'required';
		}

		if (!req.body.rating) {
			workflow.outcome.errfor.rating = 'required';
		}

		if (workflow.hasErrors()) {
			return workflow.emit('response');
		}

		workflow.emit('createSurvey');
	});
	workflow.on('createSurvey', function() {
		var fieldsToSet = {
			experiment: req.body.experiment,
			activity: req.body.activity,
			population: req.body.population,
			response: req.body.response,
			rating: req.body.rating,
			notes: req.body.notes
		}

		req.app.db.models.Survey.create(fieldsToSet, function(err, survey) {
			if (err) {
				return workflow.emit('exception', err);
			}
			workflow.emit('response');
		});
	});

	workflow.emit('validate');
};
