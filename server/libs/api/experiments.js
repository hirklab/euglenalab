'use strict';

var router = require('express').Router();
var mongoose = require('mongoose');
var _ = require('lodash');

var utils = require('../utils');
var ensureAuthenticated = utils.ensureAuthenticated;
var ensureAdmin = utils.ensureAdmin;
var ensureAccount = utils.ensureAccount;



// d) MP -> API : POST /experiment/ (Choose BPU to experiment with)
// 	Response: experimentID, queueID and waitTime


// e) MP -> API : GET /experiment/{id}/status/ (Get status of experiment)
// 	Response: status and waitTime
var get_experiment_status = function(req, res) {
    /*

     */
};

// f) MP -> API : GET /experiment/{id}/filter={type of data} (Get data from experiment)
// 	Response: zip file with all filtered data
var get_experiment_detail = function(req, res) {
    // /account/joinlabwithdata/download/58014fd349a92e241293f04c/
	req.app.db.models.BpuExperiment.findById(req.params.id).populate('roles.admin', 'name.full').populate('roles.account', 'name.full').exec(function(err, userExp) {
		if (err) {
			return next(err);
		}

		res.send(userExp);
	});
};

var find = function(req, res) {
    var outcome = {
        joinQueueDataObj: req.app.db.models.BpuExperiment.getDataObjToJoinQueue()
    };

    outcome.session = null;
    var getSession = function(callback) {
        var sessUpdate = {
            url: req.url,
            sessionID: req.sessionID,
            user: {
                id: req.user.id,
                name: req.user.username,
                groups: req.user.groups,
            },
            isVerified: false,
        };
        req.app.db.models.Session.findOneAndUpdate({
            sessionID: req.sessionID
        }, sessUpdate, {
            new: true
        }, function(err, doc) {
            if (err) {
                return callback('getSession:' + err);
            } else if (doc === null || doc === undefined) {
                var sessInfo = {
                    url: req.url,
                    sessionID: req.sessionID,
                    user: {
                        id: req.user.id,
                        name: req.user.username,
                        groups: req.user.groups,
                    },
                };
                req.app.db.models.Session.makeNewSession(sessInfo, function(err, newDoc) {
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
    var getUser = function(callback) {
        req.app.db.models.User.findById(outcome.session.user.id, 'username  groups').exec(function(err, doc) {
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

    outcome.bpus = null;
    outcome.bpuJadeObjects = [];
    var getBpus = function(callback) {
        var query = req.app.db.models.Bpu.find({
            isOn: true,
            allowedGroups: {
                $in: outcome.user.groups
            },
        });
        query.select('isOn bpuStatus index name magnification allowedGroups localAddr publicAddr bpu_processingTime session liveBpuExperiment performanceScores');
        query.exec(function(err, docs) {
            if (err) {
                return callback('getBpus:' + err);
            } else if (docs === null || docs === undefined) {
                return callback('getBpus:' + 'dne');
            } else {
                outcome.bpus = docs;

                //Make Jade Object for each bpu
                outcome.bpus.forEach(function(bpu) {
                    var bpuJadeObj = {};
                    bpuJadeObj.name = bpu.name;
                    bpuJadeObj.index = bpu.index;

                    bpuJadeObj.titleLabelJadeName = 'BpuTitleLabel' + bpu.index;
                    bpuJadeObj.titleLabel = bpu.name + ', User:None';

                    bpuJadeObj.userLabelJadeName = 'BpuUserLabel' + bpu.index;
                    bpuJadeObj.userLabel = 'Time Left:0 seconds';

                    bpuJadeObj.statusLabelJadeName = 'BpuStatusLabel' + bpu.index;
                    bpuJadeObj.statusLabel = 'Status:' + 'Unknown';

                    bpuJadeObj.timeLabelJadeName = 'BpuTimeLabel' + bpu.index;
                    bpuJadeObj.timeLabel = 'Time:? sec';

                    bpuJadeObj.joinLiveJadeName = 'bpuJoinLiveButton' + bpu.index; //do not change used in client

                    bpuJadeObj.submitTextJadeName = 'bpuSubmitTextButton' + bpu.index; //do not change used in client

                    bpuJadeObj.imageSrc = bpu.getWebSnapShotUrl();

                    outcome.bpuJadeObjects.push(bpuJadeObj);
                });
                return callback(null);
            }
        });
    };

    outcome.bpuWithExp = null;
    outcome.liveBpuExperiment = null;
    var checkBpusAgainstLiveSessionExperiment = function(callback) {
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

    var getExperimentData = function(callback) {
        req.query.wasDataProcessed = req.query.wasDataProcessed ? req.query.wasDataProcessed : true;
        req.query.isRunOver = req.query.isRunOver ? req.query.isRunOver : true;
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '-_id';

        var filters = {}; //filters is the first object givne to the db.model.collection.find(filters, ..);
        filters['user.name'] = req.user.username;
        filters['exp_status'] = 'finished';
        req.app.db.models.BpuExperiment.pagedFind({
            filters: filters,
            keys: '',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
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

    outcome.data = null;
    var buildClientSideData = function(callback) {
        outcome.data = {
            results: JSON.stringify(outcome.results),
            user: JSON.stringify(outcome.user),
            bpus: escape(JSON.stringify(outcome.bpus)),
            session: escape(JSON.stringify(outcome.session)),
            joinQueueDataObj: escape(JSON.stringify(outcome.joinQueueDataObj)),
            eugs: outcome.bpuJadeObjects,
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

    async.series(initSeriesFuncs, function(err) {
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

var listExperiments = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        req.query.search = req.query.search ? req.query.search : null;
        req.query.status = req.query.status ? req.query.status : null;
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '-_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        if (req.query.status) {
            filters['exp_status'] = req.query.status;
        }

        filters['user.name'] = req.user.username;
        // console.log(filters);

        req.app.db.models.BpuExperiment.pagedFind({
            filters: filters,
            keys: 'name user group_experimentType exp_submissionTime exp_wantsBpuName exp_eventsToRun exp_status' +
            ' exp_metaData tag',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var data = _.map(results.data, function(result) {
                var newResult = {};

                newResult.id = result._id;
                newResult.name = result.name;
                newResult.username = result.user.name;
                newResult.type = result.group_experimentType;
                newResult.submittedAt = result.exp_submissionTime;
                newResult.bpu = result.exp_wantsBpuName;
                newResult.events = result.exp_eventsToRun;
                newResult.status = result.exp_status;
                newResult.metadata = result.exp_metaData;
                newResult.tag = result.tag;

                return newResult;
            });

            workflow.outcome.results = data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

router.get('/', ensureAuthenticated, ensureAccount, listExperiments);
router.get('/:id/', ensureAuthenticated, ensureAccount, get_experiment_detail);
router.get('/:id/status/', ensureAuthenticated, ensureAccount, get_experiment_status);
// router.post('/', ensureAuthenticated, require('./views/index').create_experiment);

module.exports = router;