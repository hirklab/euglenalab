'use strict';

var router   = require('express').Router();
var mongoose = require('mongoose');
var _        = require('lodash');
var exec     = require('child_process').exec;
var async    = require('async');
var fs       = require('fs');
var temp     = require('temp');
var rmdir    = require('rimraf');

var flow = require('../utils/workflow');
var auth               = require('../utils/auth');
var ensureAuthenticated = auth.ensureAuthenticated;
var ensureAdmin         = auth.ensureAdmin;
var ensureAccount       = auth.ensureAccount;


var User = mongoose.model('User');
var Session = mongoose.model('Session');
var Bpu = mongoose.model('Bpu');
var BpuExperiment = mongoose.model('BpuExperiment');
var ListExperiment = mongoose.model('ListExperiment');

// POST /experiment/ (Choose BPU to experiment with)
// Response: experimentID, queueID and waitTime


// GET /experiment/{id}/status/ (Get status of experiment)
// Response: status and waitTime
var status = function (req, res) {
	/*

	 */
};

// GET /experiment/{id}/filter={type of data} (Get data from experiment)
// Response: zip file with all filtered data
var detail = function (req, res) {
	BpuExperiment.findById(req.params.id).populate('roles.admin', 'name.full').populate('roles.account', 'name.full').exec(function (err, userExp) {
		if (err) {
			return next(err);
		}

		res.send(userExp);
	});
};

var find = function (req, res) {
	var outcome = {
		joinQueueDataObj: BpuExperiment.getDataObjToJoinQueue()
	};

	outcome.session = null;
	var getSession  = function (callback) {
		var sessUpdate = {
			url:        req.url,
			sessionID:  req.sessionID,
			user:       {
				id:     req.user.id,
				name:   req.user.username,
				groups: req.user.groups,
			},
			isVerified: false,
		};
		Session.findOneAndUpdate({
			sessionID: req.sessionID
		}, sessUpdate, {
			new: true
		}, function (err, doc) {
			if (err) {
				return callback('getSession:' + err);
			} else if (doc === null || doc === undefined) {
				var sessInfo = {
					url:       req.url,
					sessionID: req.sessionID,
					user:      {
						id:     req.user.id,
						name:   req.user.username,
						groups: req.user.groups,
					},
				};
				Session.makeNewSession(sessInfo, function (err, newDoc) {
					if (err) {
						return callback('getSession:' + err);
					} else {
						outcome.session = newDoc;
						return callback(null);
					}
				});
			} else {
				outcome.session = doc;
				return callback(null);
			}
		});
	};

	outcome.user = null;
	var getUser  = function (callback) {
		User.findById(outcome.session.user.id, 'username  groups').exec(function (err, doc) {
			if (err) {
				return callback('getUser:' + err);
			} else if (doc === null || doc === undefined) {
				return callback('getUser:' + 'dne');
			} else {
				outcome.user = doc;
				return callback(null);
			}
		});
	};

	outcome.bpus           = null;
	outcome.bpuJadeObjects = [];
	var getBpus            = function (callback) {
		var query = Bpu.find({
			isOn:          true,
			allowedGroups: {
				$in: outcome.user.groups
			},
		});
		query.select('isOn bpuStatus index name magnification allowedGroups localAddr publicAddr bpu_processingTime session liveBpuExperiment performanceScores');
		query.exec(function (err, docs) {
			if (err) {
				return callback('getBpus:' + err);
			} else if (docs === null || docs === undefined) {
				return callback('getBpus:' + 'dne');
			} else {
				outcome.bpus = docs;

				//Make Jade Object for each bpu
				outcome.bpus.forEach(function (bpu) {
					var bpuJadeObj   = {};
					bpuJadeObj.name  = bpu.name;
					bpuJadeObj.index = bpu.index;

					bpuJadeObj.titleLabelJadeName = 'BpuTitleLabel' + bpu.index;
					bpuJadeObj.titleLabel         = bpu.name + ', User:None';

					bpuJadeObj.userLabelJadeName = 'BpuUserLabel' + bpu.index;
					bpuJadeObj.userLabel         = 'Time Left:0 seconds';

					bpuJadeObj.statusLabelJadeName = 'BpuStatusLabel' + bpu.index;
					bpuJadeObj.statusLabel         = 'Status:' + 'Unknown';

					bpuJadeObj.timeLabelJadeName = 'BpuTimeLabel' + bpu.index;
					bpuJadeObj.timeLabel         = 'Time:? sec';

					bpuJadeObj.joinLiveJadeName = 'bpuJoinLiveButton' + bpu.index; //do not change used in client

					bpuJadeObj.submitTextJadeName = 'bpuSubmitTextButton' + bpu.index; //do not change used in client

					bpuJadeObj.imageSrc = bpu.getWebSnapShotUrl();

					outcome.bpuJadeObjects.push(bpuJadeObj);
				});
				return callback(null);
			}
		});
	};

	outcome.bpuWithExp                        = null;
	outcome.liveBpuExperiment                 = null;
	var checkBpusAgainstLiveSessionExperiment = function (callback) {
		for (var ind = 0; ind < outcome.bpus.length; ind++) {
			var bpu = outcome.bpus[ind];
			if (outcome.session.liveBpuExperiment && outcome.session.liveBpuExperiment.id && bpu.liveBpuExperiment && bpu.liveBpuExperiment.id) {
				if (outcome.session.liveBpuExperiment.id === bpu.liveBpuExperiment.id) {
					outcome.bpuWithExp = bpu;
					break;
				}
			}
		}
		if (outcome.bpuWithExp) {
			return callback('send to lab');
		} else {
			return callback(null);
		}
	};

	var getExperimentData = function (callback) {
		req.query.wasDataProcessed = req.query.wasDataProcessed ? req.query.wasDataProcessed : true;
		req.query.isRunOver        = req.query.isRunOver ? req.query.isRunOver : true;
		req.query.limit            = req.query.limit ? parseInt(req.query.limit, null) : 20;
		req.query.page             = req.query.page ? parseInt(req.query.page, null) : 1;
		req.query.sort             = req.query.sort ? req.query.sort : '-_id';

		var filters           = {}; //filters is the first object givne to the db.model.collection.find(filters, ..);
		filters['user.name']  = req.user.username;
		filters['exp_status'] = 'finished';
		BpuExperiment.pagedFind({
			filters: filters,
			keys:    '',
			limit:   req.query.limit,
			page:    req.query.page,
			sort:    req.query.sort
		}, function (err, results) {
			if (err) {
				return next(err);
			}
			outcome.results = results;
			if (req.xhr) {
				res.header("Cache-Control", "no-cache, no-store, must-revalidate");
				results.filters = req.query;
				res.send(results);
			}
			outcome.results.filters = req.query;
			return callback(null);
		});
	};

	outcome.data            = null;
	var buildClientSideData = function (callback) {
		outcome.data = {
			results:          JSON.stringify(outcome.results),
			user:             JSON.stringify(outcome.user),
			bpus:             escape(JSON.stringify(outcome.bpus)),
			session:          escape(JSON.stringify(outcome.session)),
			joinQueueDataObj: escape(JSON.stringify(outcome.joinQueueDataObj)),
			eugs:             outcome.bpuJadeObjects,
		};
		return callback(null);
	};

	var initSeriesFuncs = [];
	initSeriesFuncs.push(getSession);
	initSeriesFuncs.push(getUser);
	initSeriesFuncs.push(getBpus);
	initSeriesFuncs.push(checkBpusAgainstLiveSessionExperiment);
	initSeriesFuncs.push(getExperimentData);
	initSeriesFuncs.push(buildClientSideData);

	async.series(initSeriesFuncs, function (err) {
		if (err) {
			return next(err);
		} else {
			//console.log(outcome.data);
			res.render('account/joinlabwithdata/index', {
				data: outcome.data
			});
		}
	});
};

var list = function (req, res) {
	var workflow = flow(req,res);

	workflow.on('find', function () {
		req.query.search = req.query.search ? req.query.search : null;
		req.query.status = req.query.status ? req.query.status : null;
		req.query.limit  = req.query.limit ? parseInt(req.query.limit, 10) : 10;
		req.query.page   = req.query.page ? parseInt(req.query.page, 10) : 1;
		req.query.sort   = req.query.sort ? req.query.sort : '-_id';

		var filters = {};

		if (req.query.search) {
			filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
		}

		if (req.query.status) {
			filters['exp_status'] = req.query.status;
		}

		filters['user.name'] = req.user.username;

		BpuExperiment.pagedFind({
			filters: filters,
			keys:    'name user group_experimentType exp_submissionTime exp_wantsBpuName exp_eventsToRun exp_status exp_metaData tag',
			limit:   req.query.limit,
			page:    req.query.page,
			sort:    req.query.sort
		}, function (err, results) {
			if (err) {
				return workflow.emit('exception', err);
			}

			var data = _.map(results.data, function (result) {
				var newResult = {};

				newResult.id          = result._id;
				newResult.name        = result.name;
				newResult.username    = result.user.name;
				newResult.type        = result.group_experimentType;
				newResult.submittedAt = result.exp_submissionTime;
				newResult.bpu         = result.exp_wantsBpuName;
				newResult.events      = result.exp_eventsToRun;
				newResult.status      = result.exp_status;
				newResult.metadata    = result.exp_metaData;
				newResult.tag         = result.tag;

				return newResult;
			});

			workflow.outcome.results = data;
			workflow.outcome.pages   = results.pages;
			workflow.outcome.items   = results.items;
			workflow.emit('response');
		});
	});

	workflow.emit('find');

};

var download = function (req, res) {
	var workflow = flow(req,res);

	var sendFile = function (dir, filename) {
		if (dir && filename) {
			res.download(dir, filename, function (err) {
				if (err) {
					workflow.emit('exception', err);
				}
			});
		} else {
			return workflow.emit('exception', 'path and filename missing');
		}
	};

	var packaging = function (userExp, callback) {

		var destPath = __dirname.split('/server/')[0] + '/' + 'server/public/media/tars';

		var outcome = {
			destPath: destPath,
			srcPath:  null,
			filename: null
		};

		var checkProcessingFolderPath = function (cb_fn) {
			if (userExp.proc_endPath != null) {
				fs.stat(userExp.proc_endPath, function (err, stat) {
					if (err) {
						cb_fn(err);
					} else {
						outcome.srcPath  = userExp.proc_endPath;
						outcome.filename = userExp._id;
						cb_fn(null);
					}
				});
			} else {
				cb_fn('invalid path: ' + userExp.proc_endPath);
			}
		};

		var tarFolderToServerPublicMedia = function (cb_fn) {
			//untar and move
			var src    = outcome.srcPath;
			var dest   = outcome.destPath + '/' + outcome.filename + '.tar.gz';
			//var dest=outcome.filename+'.tar.gz';
			var cmdStr = 'tar -cvzf ' + dest + ' -C ' + src + ' .';
			var child  = exec(cmdStr, function (error, stdout, stderr) {
				if (error !== null) {
					return cb_fn('tarFolderToServerPublicMedia exec error ' + stderr);
				} else if (stderr) {
					//it may exist
					fs.stat(dest, function (err, stat) {
						if (err) {
							return cb_fn('tarFolderToServerPublicMedia fs.stat ' + stderr);
						} else {
							return cb_fn(null);
						}
					});
				} else if (stdout) {
					return cb_fn(null);
				} else {
					return cb_fn(null);
				}
			});
		};

		var zipFolderToServerPublicMedia = function (cb_fn) {
			//untar and move
			var src    = outcome.srcPath;
			var dest   = outcome.destPath + '/' + outcome.filename + '.zip';
			//var dest=outcome.filename+'.tar.gz';
			var cmdStr = 'zip -rj ' + dest + ' ' + src;
			var child  = exec(cmdStr, function (error, stdout, stderr) {
				if (error !== null) {
					return cb_fn('zipFolderToServerPublicMedia exec error ' + stderr);
				} else if (stderr) {
					//it may exist
					fs.stat(dest, function (err, stat) {
						if (err) {
							return cb_fn('zipFolderToServerPublicMedia fs.stat ' + stderr);
						} else {
							return cb_fn(null);
						}
					});
				} else if (stdout) {
					return cb_fn(null);
				} else {
					return cb_fn(null);
				}
			});
		};

		async.series([
			checkProcessingFolderPath,
			zipFolderToServerPublicMedia
		], function (err) {
			if (err) {
				callback(err);
			} else {
				callback(null, outcome.destPath + '/' + outcome.filename + '.zip', outcome.filename + '.zip');
			}
		});
	};

	workflow.on('find', function () {
		BpuExperiment.findById(req.params.id, {}, function (err, userExp) {
			if (err) {
				return workflow.emit('exception', err);
			} else if (userExp === null || userExp === undefined) {
				return workflow.emit('exception', 'experiment missing');
			} else if (false && userExp.user_tarFilePath && userExp.user_tarFilename) {
				sendFile(userExp.user_tarFilePath, userExp.user_tarFilename);
			} else {
				packaging(userExp, function (err, newTarLoc, newTarFilename) {
					if (err) {
						return workflow.emit('exception', err);
					} else {
						userExp.user_tarFilePath = newTarLoc;
						userExp.user_tarFilename = newTarFilename;
						userExp.save(function (err, saveDoc) {
							if (err) {
								sendFile(userExp.user_tarFilePath, userExp.user_tarFilename);
							} else {
								sendFile(saveDoc.user_tarFilePath, saveDoc.user_tarFilename);
							}
						});
					}
				});
			}
		});
	});

	workflow.emit('find');
};

var survey = function(req, res) {
	var workflow = flow(req,res);

	workflow.on('validate', function() {
		if (!req.body.experiment) {
			workflow.outcome.errfor.experiment = 'required';
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
			rating: req.body.rating,
			notes: req.body.notes
		};

		Survey.create(fieldsToSet, function(err, survey) {
			if (err) {
				return workflow.emit('exception', err);
			}
			workflow.emit('response');
		});
	});

	workflow.emit('validate');
};

router.get('/', ensureAuthenticated, ensureAccount, list);
// router.post('/', ensureAuthenticated, require('./views/index').create_experiment);
router.get('/:id/', ensureAuthenticated, ensureAccount, detail);
router.get('/:id/status/', ensureAuthenticated, ensureAccount, status);
router.get('/:id/download/', download);
router.post('/:id/survey/', survey);


module.exports = router;