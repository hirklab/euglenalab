var assert = require('assert');
var path = require('path');
var filename = path.basename(__filename);
const MACHINE = process.env.MACHINE;
var isFake = MACHINE !== 'raspberrypi';

exports=module.exports=function(app, deps, mainCallback) {
  var moduleName=filename;

  assert(app!==null,'missing app');
  assert(app.mainConfig!==null,'missing mainConfig');
  assert(app.script_socketBpu!==null,'missing script_socketBpu');
  assert(app.script_fakeMongo!==null,'missing script_fakeMongo');
  assert(app.script_resetBpu!==null,'missing script_resetBpu');
  assert(app.script_runExperiment!==null,'missing script_runExperiment');
  assert(app.script_runExperiment!==null,'missing script_runExperiment');
    
    var num=0;

    //Get Bpu Config From Main Config
    var getConfig=function(callback) {
      var _ = deps.lodash;

      num++;
      var fName=num+' getConfig';
      app.logger.debug(moduleName+' '+fName+' '+'start');
      //app.logger.debug(deps.os.networkInterfaces());

      //Find bpu config by ip
      //var thisIP=deps.os.networkInterfaces().eth0[0].address;
      var thisIP=_.first(_.map(_.filter(_.flatten(_.values(deps.os.networkInterfaces())), { family: 'IPv4', internal: false }), 'address'));

      if(isFake){
        thisIP='127.0.0.1';
      }

      for(var ind=0;ind<app.MainConfig.bpus.length;ind++) {
	      //app.logger.debug(app.MainConfig.bpus[ind].localAddr.ip + ' == ' + thisIP);

        if(app.MainConfig.bpus[ind].localAddr.ip===thisIP) {
          app.bpuStatusTypes=app.MainConfig.bpuStatusTypes;
          app.bpuStatus=app.bpuStatusTypes.initializing;
          app.bpuConfig=app.MainConfig.bpus[ind];
          app.socketStrs=app.MainConfig.socketStrs;
          app.logger.trace(moduleName+' '+fName+' '+app.MainConfig.bpus[ind].name+', '+app.MainConfig.bpus[ind].localAddr.ip+' FOUND');
          break;
        } else {
          //app.logger.trace(moduleName+' '+fName+' '+app.MainConfig.bpus[ind].name+', '+app.MainConfig.bpus[ind].localAddr.ip+' IGNORED');
        }
      }

      //Finish
      if(app.bpuConfig===null || app.bpuConfig===undefined) {
        return callback(fName+':no bpu config found for ip '+thisIP);
      } else {
        return callback(null);
      }
    };

    //Create Socket Server
    var createSocket=function(callback) {
      num++;
      var fName=num+' createSocket';
      var opts={};
      app.logger.debug(moduleName+' '+fName+' '+'start');
      app.script_socketBpu(app, deps, opts, function(err) {
        if(err) {
          app.logger.error(fName+' script_socketBpu callback:'+err);
          return callback(err);
        } else {
          return callback(null);
        }
      });
    };

    //Build Fake Mongo
    var buildFakeMongo=function(callback) {
      num++;
      var fName=num+' buildFakeMongo';
      var opts={
        savePath:app.expDataDir,
      };
      app.logger.debug(moduleName+' '+fName+' '+'start');
      app.script_fakeMongo(app, deps, opts, function(err, fakeMongoDb) {
        if(err) {
          app.logger.error(fName+' script_socketBpu callback:'+err);
          return callback(err);
        } else {
          app.db=fakeMongoDb;
          return callback(null);
        }
      });
    };

    //Build Series
    var funcs=[];
    funcs.push(getConfig);
    funcs.push(createSocket);
    funcs.push(buildFakeMongo);
    
    //Start Series 
    var startDate=new Date();
    app.logger.info(moduleName+' start');
    app.async.series(funcs, function(err) {
      app.logger.info(moduleName+' end in '+(new Date()-startDate)+' ms');
      if(err) {
        app.bpuStatus='initializingFailed';
        mainCallback(err);
      } else {
        app.bpuStatus=app.bpuStatusTypes.initializingDone;
        mainCallback(null);
      }
    }); 

};
