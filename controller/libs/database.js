var mongoose = require('mongoose');

var config = require('../config');

module.exports = function (app, callback) {
    "use strict";


    app.db = mongoose.createConnection(config.DB_URL);
    app.db.on('error', function (err) {
        app.logger.error(err);
        callback(err);
    });

    app.db.once('open', function () {
        app.logger.info('database => ' + config.DB_URL);

        require('./models')(app, mongoose);
        callback(null);
    });

    app.db.getExperiments = function (callback) {
        var ListExperiment = mongoose.model('ListExperiment');

        ListExperiment.getInstanceDocument(callback);
    };

    app.db.getBPUs = function (callback) {
        var Bpu = mongoose.model('Bpu');

        var query = Bpu.find({
            isOn: true
        });

        query.select('isOn bpuStatus index name magnification allowedGroups localAddr publicAddr bpu_processingTime session liveBpuExperiment performanceScores');
        query.exec(callback);
    }
};
