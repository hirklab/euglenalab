'use strict';

var schemaPath = './';

exports = module.exports = function (app, mongoose) {
    var Survey = require(schemaPath + '/Survey')(app);
    var Session = require(schemaPath + '/Session')(app);
    var Note = require(schemaPath + '/Note')(app);
    var Status = require(schemaPath + '/Status')(app);
    var StatusLog = require(schemaPath + '/StatusLog')(app);
    var Category = require(schemaPath + '/Category')(app);
    var BpuExperiment = require(schemaPath + '/BpuExperiment')(app);
    var Bpu = require(schemaPath + '/Bpu')(app);
    var BpuGroup = require(schemaPath + '/BpuGroup')(app);
    var Group = require(schemaPath + '/Group')(app);
    var ListExperiment = require(schemaPath + '/ListExperiment')(app);
    var SoapReq = require(schemaPath + '/SoapReq')(app);
    var User = require(schemaPath + '/User')(app);
    var Admin = require(schemaPath + '/Admin')(app);
    var AdminGroup = require(schemaPath + '/AdminGroup')(app);
    var Account = require(schemaPath + '/Account')(app);
    var LoginAttempt = require(schemaPath + '/LoginAttempt')(app);
    var Server = require(schemaPath + '/Server')(app);
    //require(schemaPath+'/AutoUserStatsManager')(app, mongoose);
    var UrlEvent = require(schemaPath + '/UrlEvent')(app);
    var MyFunctions = require(schemaPath + '/MyFunctions')(app);

    mongoose.model('Survey', Survey,'surveys');
    mongoose.model('Session', Session, 'sessions');
    mongoose.model('Note', Note, 'notes');
    mongoose.model('Status', Status, 'status');
    mongoose.model('StatusLog', StatusLog,'statuslog');
    mongoose.model('Category', Category,'categories');
    mongoose.model('BpuExperiment', BpuExperiment,'bpuexperiments');
    mongoose.model('Bpu', Bpu, 'bpus');
    mongoose.model('BpuGroup', BpuGroup, 'bpugroups');
    mongoose.model('Group', Group, 'groups');
    mongoose.model('ListExperiment', ListExperiment,'listexperiments');
    mongoose.model('SoapReq', SoapReq, 'soapreqs');
    mongoose.model('User', User, 'users');
    mongoose.model('Admin', Admin, 'admins');
    mongoose.model('AdminGroup', AdminGroup, 'admingroups');
    mongoose.model('Account', Account,'accounts');
    mongoose.model('LoginAttempt', LoginAttempt, 'loginattempts');
    mongoose.model('Server', Server,'servers');
    mongoose.model('UrlEvent', UrlEvent,'urlevents');
    mongoose.model('MyFunctions', MyFunctions, 'myfunctions');
};