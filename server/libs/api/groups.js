'use strict';

var router = require('express').Router();
var mongoose = require('mongoose');

var utils = require('../utils');

var ensureAuthenticated = utils.ensureAuthenticated;
var ensureAdmin = utils.ensureAdmin;
var ensureAccount = utils.ensureAccount;


var list = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        req.query.search = req.query.search ? req.query.search : '';
        req.query.status = req.query.status ? req.query.status : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.Group.pagedFind({
            filters: filters,
            keys: 'name description users settings',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var data = _.map(results.data, function (result) {
            //     console.log(result.roles.hasOwnProperty('admin'));
            //
            //     result.role = "account";
            //     if(result.roles.hasOwnProperty('admin')){
            //         result.role = "admin";
            //     }
            //     return result;
            // });

            workflow.outcome.results = results.data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

var detail = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        // req.query.search = req.query.search ? req.query.search : '';
        // req.query.status = req.query.status ? req.query.status : '';
        // req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        // req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        // req.query.sort = req.query.sort ? req.query.sort : '_id';
        //
        // var filters = {};
        // if (req.query.search) {
        //     filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        // }

        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.Group.findById(req.params.id, 'name description users settings').exec(function(err, result) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var data = _.map(results.data, function (result) {
            //     console.log(result.roles.hasOwnProperty('admin'));
            //
            //     result.role = "account";
            //     if(result.roles.hasOwnProperty('admin')){
            //         result.role = "admin";
            //     }
            //     return result;
            // });

            workflow.outcome.results = result;
            // workflow.outcome.pages = results.pages;
            // workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

router.get('/', ensureAuthenticated, ensureAdmin, list);
router.get('/:id/', ensureAuthenticated, ensureAdmin, detail);

module.exports = router;