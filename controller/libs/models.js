'use strict';

var schemaPath = '../../shared/mongoDb/schema';

exports = module.exports = function (app, mongoose) {
    var Note = require(schemaPath + '/Note')(app);
    var Session = require(schemaPath + '/Session')(app);
    var BpuExperiment = require(schemaPath + '/BpuExperiment')(app);
    var Bpu = require(schemaPath + '/Bpu')(app);
    var ListExperiment = require(schemaPath + '/ListExperiment')(app);
    var User = require(schemaPath + '/User')(app);
    var MyFunctions = require(schemaPath + '/MyFunctions')(app);


    mongoose.model('Session', Session, 'sessions');
    mongoose.model('Note', Note, 'notes');
    mongoose.model('BpuExperiment', BpuExperiment,'bpuexperiments');
    mongoose.model('Bpu', Bpu, 'bpus');
    mongoose.model('ListExperiment', ListExperiment,'listexperiments');
    mongoose.model('User', User, 'users');
    mongoose.model('MyFunctions', MyFunctions, 'myfunctions');
};
