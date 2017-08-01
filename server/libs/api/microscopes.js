'use strict';

var router = require('express').Router();
var mongoose = require('mongoose');
var _ = require('lodash');

var utils = require('../utils');
var ensureAuthenticated = utils.ensureAuthenticated;
var ensureAdmin = utils.ensureAdmin;
var ensureAccount = utils.ensureAccount;


// c) MP -> API : GET / (List of bio processing units)
// 	Response: list of units
var get_bio_units = function (req, res) {
    // console.log('get microsco');
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function () {
        req.query.search = req.query.search ? req.query.search : '';
        req.query.status = req.query.status ? req.query.status : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : 'name';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        if (req.query.status) {
            filters['status.id'] = req.query.status;
        }

        req.app.db.models.Bpu.pagedFind({
            filters: filters,
            keys: 'name index isOn currentStatus magnification allowedGroups localAddr publicAddr avgStatsData',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function (err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var data = _.map(results.data, function (result) {
                var newResult = {};

                if (result.currentStatus === null || result.currentStatus === undefined) {

                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    newResult.processingTimePerExperiment = 'unknown';
                    newResult.bpuStatus = 'unknown';
                    newResult.expId = 'unknown';
                    newResult.username = 'unknown';
                    newResult.allowedGroups = 'unknown';
                    newResult.isReady = false;
                    newResult.isOver = false;
                    newResult.isCanceled = false;
                    newResult.err = null;
                    newResult.setTime = 'unknown';
                    newResult.runTime = 'unknown';
                    newResult.timeLeft = 0;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;

                    return newResult;
                } else {
                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    //newResult.processingTimePerExperiment = result.currentStatus.processingTimePerExperiment;
                    newResult.bpuStatus = result.currentStatus.bpuStatus;
                    newResult.expId = result.currentStatus.expId;
                    newResult.username = result.currentStatus.username;
                    newResult.allowedGroups = result.currentStatus.allowedGroups;
                    newResult.isReady = result.currentStatus.isReady;
                    newResult.isOver = result.currentStatus.isOver;
                    newResult.isCanceled = result.currentStatus.isCanceled;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;
                    newResult.err = result.currentStatus.err;

                    if (typeof result.currentStatus.setTime.getTime === 'function') {
                        newResult.setTime = Math.round((new Date() - result.currentStatus.setTime) / 60000);
                    }
                    if (typeof result.currentStatus.setTime.timeLeft === 'number') {
                        newResult.timeLeft = Math.round(result.currentStatus.timeLeft / 1000);
                    }
                    if (typeof result.currentStatus.setTime.runTime === 'number') {
                        newResult.runTime = Math.round(result.currentStatus.runTime / 1000);
                    }

                    return newResult;
                }
            });

            workflow.outcome.results = data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');
};

// c) MP -> API : GET /:id/ (detail of bio processing units)
// 	Response: unit
var bio_unit_detail = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function () {
        // req.query.search = req.query.search ? req.query.search : '';
        // req.query.status = req.query.status ? req.query.status : '';
        // req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        // req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        // req.query.sort = req.query.sort ? req.query.sort : '_id';

        // var filters = {};
        // if (req.query.search) {
        //     filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        // }
        //
        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.Bpu.findById(req.params.id,
            'name index isOn currentStatus magnification allowedGroups localAddr publicAddr avgStatsData notes').exec(
            function (err, result) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                // console.log(response);
                // var result = response;


                var newResult = {};

                if (result.currentStatus === null || result.currentStatus === undefined) {

                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    newResult.processingTimePerExperiment = 'unknown';
                    newResult.bpuStatus = 'unknown';
                    newResult.expId = 'unknown';
                    newResult.username = 'unknown';
                    newResult.allowedGroups = 'unknown';
                    newResult.isReady = false;
                    newResult.isOver = false;
                    newResult.isCanceled = false;
                    newResult.err = null;
                    newResult.setTime = 'unknown';
                    newResult.runTime = 'unknown';
                    newResult.timeLeft = 0;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;
                    newResult.notes = result.notes;

                } else {
                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    // newResult.processingTimePerExperiment = result.currentStatus.processingTimePerExperiment;
                    newResult.bpuStatus = result.currentStatus.bpuStatus;
                    newResult.expId = result.currentStatus.expId;
                    newResult.username = result.currentStatus.username;
                    newResult.allowedGroups = result.currentStatus.allowedGroups;
                    newResult.isReady = result.currentStatus.isReady;
                    newResult.isOver = result.currentStatus.isOver;
                    newResult.isCanceled = result.currentStatus.isCanceled;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;
                    newResult.err = result.currentStatus.err;
                    newResult.notes = result.notes;

                    if (typeof result.currentStatus.setTime.getTime === 'function') {
                        newResult.setTime = Math.round((new Date() - result.currentStatus.setTime) / 60000);
                    }
                    if (typeof result.currentStatus.setTime.timeLeft === 'number') {
                        newResult.timeLeft = Math.round(result.currentStatus.timeLeft / 1000);
                    }
                    if (typeof result.currentStatus.setTime.runTime === 'number') {
                        newResult.runTime = Math.round(result.currentStatus.runTime / 1000);
                    }
                }


                workflow.outcome.results = newResult;
                // workflow.outcome.pages = results.pages;
                // workflow.outcome.items = results.items;
                workflow.emit('response');
            }
        );
    });

    workflow.emit('find');
};

var bio_unit_health = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    function getPerformance(username, param, bpu_id, startDate, endDate, scale, cb) {
        var endDate = parseInt(endDate);
        var startDate = parseInt(startDate);

        var filters = {};
        filters['user.name'] = username;
        filters['stats.' + username] = {
            $ne: -1
        };
        filters['liveBpu.id'] = mongoose.Types.ObjectId(bpu_id);
        filters['exp_processingEndTime'] = {
            // $lt: endDate, //new Date(endDate.getYear(), endDate.getMonth(), endDate.getDate())
            $gte: startDate //new Date(startDate.getYear(), startDate.getMonth(), startDate.getDate()),
        };

        var projections = {};
        projections[param] = '$stats.' + username;
        projections['bpu_id'] = '$liveBpu.id';
        projections['exp_processingEndTime'] = 1;
        projections['rating'] = '$survey.rating';
        projections['notes'] = '$survey.notes';

        req.app.db.models.BpuExperiment.aggregate([{
            $match: filters,
        }, {
            $lookup: {
                localField: "_id",
                from: "surveys",
                foreignField: "experiment",
                as: "survey"
            }
        }, {
            $project: projections
        }]).exec(function (err, results) {
            if (err) {

                cb(err, null);
            } else {
                var newResult = [];

                results.forEach(function (result) {
                    var endResult = {};
                    endResult['datetime'] = new Date(result.exp_processingEndTime);
                    if (result[param] > 0) {
                        endResult[param] = result[param] * scale;
                        newResult.push(endResult);
                    }

                    // var endResult = {};
                    // endResult['datetime'] = new Date(result.exp_processingEndTime);

                    // if (result['rating'].length > 0 && result['rating'][0] > 0) {
                    //     endResult['rating'] = result['rating'].length > 0 ? Math.round(result['rating'][0]) : 0;
                    //     endResult['notes'] = result['notes'].length > 0 ? result['notes'][0] : "";
                    //     newResult.push(endResult);
                    // }

                });

                cb(null, newResult);
            }
        })
    }

    function getRatings(username, param, bpu_id, startDate, endDate, scale, cb) {
        var endDate = parseInt(endDate);
        var startDate = parseInt(startDate);

        var filters = {};
        // filters['user.name'] = username;
        // filters['stats.' + username] = {
        //     $eq: -1
        // };
        filters['liveBpu.id'] = mongoose.Types.ObjectId(bpu_id);
        filters['exp_processingEndTime'] = {
            // $lt: endDate, //new Date(endDate.getYear(), endDate.getMonth(), endDate.getDate())
            $gte: startDate //new Date(startDate.getYear(), startDate.getMonth(), startDate.getDate()),
        };

        var projections = {};
        // projections[param] = '$stats.' + username;
        projections['bpu_id'] = '$liveBpu.id';
        projections['exp_processingEndTime'] = 1;
        projections['rating'] = '$survey.rating';
        projections['notes'] = '$survey.notes';

        req.app.db.models.BpuExperiment.aggregate([{
            $match: filters,
        }, {
            $lookup: {
                localField: "_id",
                from: "surveys",
                foreignField: "experiment",
                as: "survey"
            }
        }, {
            $project: projections
        }]).exec(function (err, results) {
            if (err) {

                cb(err, null);
            } else {
                var newResult = [];

                results.forEach(function (result) {
                    // var endResult = {};
                    // endResult['datetime'] = new Date(result.exp_processingEndTime);
                    // if (result[param] > 0) {
                    //     endResult[param] = result[param] * scale;
                    //     newResult.push(endResult);
                    // }

                    var endResult = {};
                    endResult['datetime'] = new Date(result.exp_processingEndTime);

                    if (result[param].length > 0 && result[param][0] > 0) {
                        endResult[param] = result[param].length > 0 ? Math.round(result[param][0]) : 0;
                        endResult['notes'] = result['notes'].length > 0 ? result['notes'][0] : "";
                        newResult.push(endResult);
                    }

                });

                cb(null, newResult);
            }
        })
    }

    workflow.on('scripterActivity', function () {
        getPerformance('scripterActivity', 'activity', req.params.id, req.query.start, req.query.end, 1 * 5 / 300, function (err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {

                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('scripterPopulation');
            }
        })
    });

    workflow.on('scripterPopulation', function () {
        getPerformance('scripterPopulation', 'population', req.params.id, req.query.start, req.query.end, 1 * 5 / 100, function (err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {
                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('scripterResponse');
            }
        })
    });

    workflow.on('scripterResponse', function () {
        getPerformance('scripterResponse', 'response', req.params.id, req.query.start, req.query.end, 1 * 4, function (err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {
                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('scripterRatings');
            }
        })
    });

    workflow.on('scripterRatings', function () {
        getRatings('', 'rating', req.params.id, req.query.start, req.query.end, 1, function (err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {
                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('response');
            }
        })
    });

    workflow.emit('scripterActivity');
};

var bio_unit_queue = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('queue', function () {

        req.app.db.models.ListExperiment.getInstanceDocument(function (err, experiments) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var experiments = {
            //     "_lostList": [],
            //     "eug3": [{
            //         "user": {"id": {"$oid": "563abd7932804ebd6f70152e"}, "name": "casey", "groups": ["default"]},
            //         "session": {
            //             "id": {"$oid": "589256a7f6a172724853e9f2"},
            //             "sessionID": "Qgg229-BuB6JpnBBNjJj1Bv1Y3J4RZLf",
            //             "socketID": "yM1m4zF0uVn6-c7ZAAD_"
            //         },
            //         "bc_isLiveSendingToLab": false,
            //         "bc_startSendTime": null,
            //         "group_experimentType": "live",
            //         "exp_wantsBpuName": "eug3",
            //         "exp_metaData": {},
            //         "id": {"$oid": "58925c895953ebf648617610"},
            //         "exp_sessionID": null,
            //         "exp_status": "created",
            //         "exp_submissionTime": 1485889616950,
            //         "exp_eventsRunTime": 0,
            //         "exp_lastResort": {
            //             "canidateBpus": [{
            //                 "finalScore": 0.8255,
            //                 "queueWaitTime": 14085,
            //                 "magnification": 4,
            //                 "scripterActivity": 234.95513890539127,
            //                 "scripterPopulation": 177.31614252870125,
            //                 "scripterResponse": 1.5251098415459459,
            //                 "alphaTime": 0.8498322510870702,
            //                 "alphaPopulation": 0.5674116560918442,
            //                 "alphaActivity": 1,
            //                 "alphaResponse": 1,
            //                 "bpuName": "eug3",
            //                 "totalWaitTime": 14085
            //             }],
            //             "rejectionCounter": 0,
            //             "rejectionReason": null,
            //             "bpuName": "eug3",
            //             "runTime": null,
            //             "bpuProcessingTime": null,
            //             "totalWaitTime": 14085
            //         }
            //     }],
            //     "newExps": [{
            //         "user": {
            //             "id": {"$oid": "5887aaac6e940b815f8dd9f9"},
            //             "name": "QuinnMonahan",
            //             "groups": ["default"]
            //         },
            //         "session": {
            //             "id": {"$oid": "5887aaad6e940b815f8dd9fb"},
            //             "sessionID": "-Yrsiql84ts19sEu4WDK7RKr1x-D0biR",
            //             "socketID": "QJkffJyx-KubC_qkAABZ"
            //         },
            //         "bc_isLiveSendingToLab": false,
            //         "bc_startSendTime": null,
            //         "group_experimentType": "batch",
            //         "exp_wantsBpuName": "eug3",
            //         "exp_metaData": {},
            //         "id": {"$oid": "5890e0500096719c68e2534e"},
            //         "exp_sessionID": null,
            //         "exp_status": "created",
            //         "exp_submissionTime": 1485889616832,
            //         "exp_eventsRunTime": 0,
            //         "exp_lastResort": {
            //             "canidateBpus": [{
            //                 "finalScore": 0.7449,
            //                 "queueWaitTime": 0,
            //                 "magnification": 10,
            //                 "scripterActivity": 141.12632858114182,
            //                 "scripterPopulation": 14.929327728354595,
            //                 "scripterResponse": 0.9451034179001743,
            //                 "alphaTime": 1,
            //                 "alphaPopulation": 0.2985865545670919,
            //                 "alphaActivity": 1,
            //                 "alphaResponse": 0.6300689452667828,
            //                 "bpuName": "eug1",
            //                 "totalWaitTime": 0
            //             }],
            //             "rejectionCounter": 10,
            //             "rejectionReason": "2:checkExpAndResort BpuExperiment.findById error:Incorrect status, should alreay be out of queue",
            //             "bpuName": "eug1",
            //             "runTime": null,
            //             "bpuProcessingTime": null,
            //             "totalWaitTime": 0
            //         }
            //     }]
            // };

            // console.log(experiments.newExps);
            // console.log(experiments[req.params.name] || []);

            workflow.outcome.running = experiments['newExps']
                .filter(function (experiment) {
                    return experiment.exp_wantsBpuName === req.params.name;
                })
                .map(function (experiment) {
                    return {
                        'id': experiment._id,
                        'user': experiment.user.name,
                        'type': experiment.group_experimentType,
                        'submittedAt': experiment.exp_submissionTime,
                        'runTime': experiment.exp_eventsRunTime,
                        'status': 'in progress'
                    }
                });

            workflow.outcome.pending = (experiments[req.params.name] || [])
                .filter(function (experiment) {
                    return experiment.exp_wantsBpuName === req.params.name;
                })
                .map(function (experiment) {
                    return {
                        'id': experiment._id,
                        'bpu': req.params.name,
                        'user': experiment.user.name,
                        'type': experiment.group_experimentType,
                        'submittedAt': experiment.exp_submissionTime,
                        'runTime': experiment.exp_eventsRunTime,
                        'status': 'pending'
                    }
                });

            return workflow.emit('response');
        });
    });

    workflow.emit('queue');
};

var add_note = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    // console.log(req.user);

    workflow.on('validate', function () {
        if (!req.body.message) {
            workflow.outcome.errors.push('Message is required.');
            return workflow.emit('response');
        }

        workflow.emit('addNote');
    });

    workflow.on('addNote', function () {

        var noteToAdd = {
            data: req.body.message,
            userCreated: {
                id: req.user.id,
                name: req.user.username,
                time: new Date().toISOString()
            }
        };

        req.app.db.models.Bpu.findByIdAndUpdate(req.params.id, {
            $push: {
                notes: noteToAdd
            }
        }, {
            new: true
        }, function (err, bpu) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.notes = bpu.notes;
            return workflow.emit('response');
        });
    });

    workflow.emit('validate');
};

var remove_note = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('removeNote', function () {

        req.app.db.models.Bpu.findByIdAndUpdate(req.params.id, {
            $pull: {
                notes: {
                    _id: req.params.noteId
                }
            }
        }, {
            safe: true,
            new: true
        }, function (err, bpu) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.notes = bpu.notes;
            return workflow.emit('response');
        });
    });

    workflow.emit('removeNote');
};


router.get('/:id/', ensureAuthenticated, ensureAdmin, bio_unit_detail);
router.get('/:id/health/', ensureAuthenticated, ensureAdmin, bio_unit_health);
router.get('/:name/queue/', ensureAuthenticated, ensureAdmin, bio_unit_queue);
router.post('/:id/notes/', ensureAuthenticated, ensureAdmin, add_note);
router.delete('/:id/notes/:noteId/', ensureAuthenticated, ensureAdmin, remove_note);
router.get('/', ensureAuthenticated, ensureAccount, get_bio_units);

module.exports = router;
