var _Handle='/account/joinlabwithdata';  //socketHandle for socket connections for the page
var socketStrs={
  setConnection:'/#setConnection',         
  serverError:'/#serverError',         
  submitExperimentRequest:'/#submitExperimentRequest',    
  activateLiveUser:'/#activateLiveUser',                      
  sendUserToLiveLab:'/#sendUserToLiveLab',      
};
var _joinLabConfirmAlertCalled=false;
(function() {
  'use strict';
  //parent app
  app = app || {};

  /*
   * ============================================================================
   * KONAMI CODE TO ACTIVATE "DEMO MODE" from http://stackoverflow.com/questions/31626852/how-to-add-konami-code-in-a-website-based-on-html
   * This will allow users to play the biotic game dev mode. This is a quick hack for lab presentation demo; a real button
   * will be added when this feature is no longer secret / in development. This is done because we have real users using the
   * staging server, but I want to demo the feature so far on staging. - Peter 
   * ============================================================================
   */
  var demoMode = false;
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    65: 'a',
    66: 'b'
  };
  var konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  var konamiCodePosition = 0;
  document.addEventListener('keydown', function(e) {
    var key = allowedKeys[e.keyCode];
    var requiredKey = konamiCode[konamiCodePosition];
    if (key == requiredKey) {
      konamiCodePosition++;
      if (konamiCodePosition == konamiCode.length)
        activateCheats();
    } else
      konamiCodePosition = 0;
  });

  function activateCheats() {
    alert("DEMO MODE ACTIVATED!!!");
    demoMode = true;
  }
  /*
   * ============================================================================
   * END OF KONAMI CODE HACK; TODO(peter): Place this in appropriate file or remove
   * ============================================================================
   */
  
  //This Object 
  var me={};
  me.isInitialized=null;
  
  //expose with to parent with app 
  app.userSocketClient=me;

  //Set connection called from parent client page
  me.setConnection=function(setConnectionCallbackToParent) {
    //Timeout for socket connection
    var didCallback=false;
    setTimeout(function() {
      if(!didCallback) {
        didCallback=true;
        setConnectionCallbackToParent('timed out', null);
      }
    }, 10000);
    
    //Primary Connection
    //Primary Connection
    //Primary Connection
    var socket=io.connect();
    //Wait for Set Connection
    socket.on(socketStrs.setConnection, function(serverCallback) {
      if(!didCallback) {
        didCallback=true;
        app.mainView.session.attributes.socketID=socket.id;
        app.mainView.session.attributes.socketHandle=_Handle;
        serverCallback(app.mainView.session);
        setConnectionCallbackToParent(null);
      }
    });
    socket.on(socketStrs.serverError, function(errMsg) {
      console.log(socketStrs.serverError, errMsg);
    });
    socket.on('connect', function() {});

    //Activate Live User/Prompt for Join Confirm
    socket.on(socketStrs.activateLiveUser, function(sessDoc, confirmTimeout, callbackToServer) {
      var resData={didConfirm:false};
      _joinLabConfirmAlert(confirmTimeout, function(err, didConfirm) {
        resData.didConfirm=didConfirm;
        resData.err=err;
        if(callbackToServer) callbackToServer(resData);
      });
    });
    //Send Live User to lab
    socket.on(socketStrs.sendUserToLiveLab, function(reqObj, callbackToServer) {
      if (callbackToServer) callbackToServer({err:null});
      if (demoMode) location.href='/account/developgame/';
      else location.href='/account/livelab/';
    });
    //Update Info
    socket.on('/#update', function(updateObj) {
      var clientUpdateObj={};
      
      //Queue info for UI update
      clientUpdateObj.queueExps=[];
      clientUpdateObj.liveQueueExp=null;
      clientUpdateObj.textTotalRunTime=0;
      clientUpdateObj.textTotalExps=0;

      //Bpu Info for UI update
      clientUpdateObj.bpuLiveExp=null;
      clientUpdateObj.bpuLiveFinishTime=0;
      clientUpdateObj.bpuTextTotalRunTime=0;
      clientUpdateObj.bpuTextTotalExps=0;
     
      //Go through active bpu exps 
      updateObj.bpuExps.forEach(function(bpuExp) {
        if(bpuExp.liveBpuExperiment.group_experimentType==='live') {
          clientUpdateObj.bpuLiveExp=bpuExp;
          clientUpdateObj.bpuLiveFinishTime=bpuExp.liveBpuExperiment.bc_timeLeft;
        } else {
          clientUpdateObj.bpuTextTotalRunTime+=bpuExp.liveBpuExperiment.bc_timeLeft;
          clientUpdateObj.bpuTextTotalExps++;
        }
      });
      
      //Go through queue bpu exps 
      updateObj.queueExpTags.forEach(function(expTag) {
        if(expTag.session.sessionID!==null && expTag.session.sessionID!==undefined) {
          if(expTag.group_experimentType==='live') {
            clientUpdateObj.liveQueueExp=expTag;
          } else {
            clientUpdateObj.textTotalRunTime+=expTag.exp_eventsRunTime+expTag.exp_lastResort.totalWaitTime;
            clientUpdateObj.textTotalExps++;
          }
        }
      });

      //Go through bpu groups
      clientUpdateObj.bpusPackage=[];
      updateObj.groupBpus.forEach(function(bpu) {
        clientUpdateObj.bpusPackage.push(bpu);
      });
      app.mainView.updateFromServer(clientUpdateObj);

    });
    
    //Submit Experiment SocketParent Call to Start Join Queue Sequence
    me.submitExperimentArray=function(joinQueueDataArray, callbackToMain) {
      //Time out
      var didCallback=false;
      setTimeout(function() {
        if(!didCallback) {
          didCallback=true;
          callbackToMain('timed out in', null);
        }
      }, 5000);
      //Fix Session Info to each exp request 
      joinQueueDataArray.forEach(function(obj) {
        if(obj.group_experimentType==='live') {
          var zeroEvt=JSON.parse(JSON.stringify(obj.zeroLedEvent));
          var lastEvt=JSON.parse(JSON.stringify(obj.zeroLedEvent));
          lastEvt.time=obj.liveUserLabTime;
          obj.exp_eventsToRun.push(zeroEvt);
          obj.exp_eventsToRun.push(lastEvt);
        }
        //Session

        obj.session.id=app.mainView.session.get('_id');
        obj.session.sessionID=app.mainView.session.get('sessionID');
        obj.session.socketHandle=_Handle;
        obj.session.socketID=app.mainView.session.get('socketID');
      });
      //Send to webserve
      socket.emit(socketStrs.submitExperimentRequest, joinQueueDataArray, function(err, validationObjs) { 
        if(!didCallback) {
          didCallback=true;
          callbackToMain(err, validationObjs);
        }
      });
    };
  };

}());

//Pop up and time out
var _joinLabConfirmAlert=function(confirmTimeout, callback) {
  if(_joinLabConfirmAlertCalled) {
    callback('join lab confirm aleart already called', false);
  } else {
    _joinLabConfirmAlertCalled=true;
    var didCallback=false;
    var resTimeout=setTimeout(function() {
      if(!didCallback) {
        didCallback=true;
        _joinLabConfirmAlertCalled=false;
        callback('timed out', null);
      }
    }, confirmTimeout);
    //Alert 
    var confirmTime=Math.round(confirmTimeout/1000);
    if(confirm('Go To Lab.' +new Date()+'\n'+confirmTime+' seconds to confirm.')===true) {
      if(!didCallback) {
        didCallback=true;
        _joinLabConfirmAlertCalled=false;
        callback(null, true);
      }
    } else {
      if(!didCallback) {
        didCallback=true;
        _joinLabConfirmAlertCalled=false;
        callback(null, false);
      }
    }
  }
};
