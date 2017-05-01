(function() {
  'use strict';
  app = app || {};
  app.myMediaImagePath = '/media/ModelImageSets';
  app.Account = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/modelling/'
  });
  app.User = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/modelling/'
  });
  app.SetPath = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/modelling/'
  });
  app.ImageSet = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/modelling/'
  });
  app.ModelParameters = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/modelling/update/',
    parse: function(response) {
      if (response) {
        if (response.modelParameters) {
          app.mainView.modelParameters.set(response.modelParameters);
          delete response.modelParameters;
        }
        if (app.editorView) app.editorView.syncUp();
      }
      return response;
    }
  });
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    lastCase: 0,
    serverTab: 'threejs',
    updateCaseInfo: function(modelCase, modelCaseColor) {
      modelCase = 1;
      if (modelCase !== this.lastCase) {
        this.lastCase = modelCase;
        var text = 'Euglena Model ';
        var myUrl = "url('/media/Euglena_Model_1.png')";
        if (modelCase == 1) {
          text += '1: Angle differentiator';
          myUrl = "url('/media/Euglena_Model_1.png')";
        } else if (modelCase == 2) {
          text += '2: Two light detectors';
          myUrl = "url('/media/Euglena_Model_2.png')";
        } else if (modelCase == 3) {
          text += '3: The rotating single eye';
          myUrl = "url('/media/Euglena_Model_3.png')";
        }
        //document.getElementById('MainHeader').innerHTML=text;
        // document.getElementById('caseimage').style.backgroundColor=modelCaseColor;
        document.getElementById('divJoystick').style.backgroundColor = modelCaseColor;
        //document.getElementById('caseimage').style.backgroundImage=myUrl;
      }
    },
    //Editor
    updateFromEditorCallback: function(modelParameters, modelCaseColor, didResetParametersClick, didEditParametersClickOn, didEditParametersClickOff, didVideoJustEnded) {
      this.updateCaseInfo(Number(modelParameters.attributes.modelCase), modelCaseColor);
      if (app.trackingView) {
        if (!didVideoJustEnded) {
          app.trackingView.setEuglenaParameters(modelParameters, modelCaseColor);
        }
        if (didEditParametersClickOn) {
          app.trackingView.resetData()
          app.trackingView.startPlay = true;
        } else if (didEditParametersClickOff) {
          app.trackingView.doStopPlay = false;
        } else if (didResetParametersClick) {
          app.trackingView.resetData();
          app.trackingView.doStopPlay = true;
        }
      }
    },
    updateFromViewCallback: function(runData) {
      if (app.editorView) {
        app.editorView.videoEnded(runData);
      }
    },
    initialize: function() {
      app.mainView = this;
      //Data
      this.account = new app.Account(JSON.parse(unescape($('#data-account').html())));
      this.user = new app.User(JSON.parse(unescape($('#data-user').html())));
      this.imageset = new app.ImageSet(JSON.parse(unescape($('#data-imageset').html())));
      this.setpath = new app.SetPath(JSON.parse(unescape($('#data-setpath').html())));
      this.modelParameters = new app.ModelParameters(JSON.parse(unescape($('#data-modelParameters').html())));


      // if(this.modelParameters.get('surgeName')[0]===null || this.modelParameters.get('surgeName')[0]===undefined) {
      //   this.modelParameters.get('surgeName').push('Surge');
      // }
      // if(this.modelParameters.get('couplingName')[0]===null || this.modelParameters.get('couplingName')[0]===undefined) {
      //   this.modelParameters.get('couplingName').push('Coupling');
      // }
      // if(this.modelParameters.get('rollName')[0]===null || this.modelParameters.get('rollName')[0]===undefined) {
      //   this.modelParameters.get('rollName').push('Roll');
      // }

      // Zahid - Hack , forcing the system the variable names
      // this.modelParameters.get('surgeName')[0] = 'Surge';
      // this.modelParameters.get('couplingName')[0] = 'Coupling';
      // this.modelParameters.get('rollName')[0] = 'Roll';

      console.log('index.js initialize', this.modelParameters.id, this.modelParameters.attributes);
      console.log('index.js initialize', this.modelParameters.id);
      console.log('surge', this.modelParameters.get('surgeName')[0], this.modelParameters.get('surge')[0]);
      console.log('coupling', this.modelParameters.get('couplingName')[0], this.modelParameters.get('coupling'));
      console.log('roll', this.modelParameters.get('rollName')[0], this.modelParameters.get('roll')[0]);

      //body color
      // var bodyColor='#e0efff' ;
      // document.body.style.background=bodyColor;
      //Make editor View
      app.editorView = new MyTrackingEditor(app);

      //Make tracking View
      app.trackingView = new MyTrackingView(app, document.getElementById('trackingview'), function() {
        app.trackingView.addMouseMoveEvent();
        app.trackingView.toggleClickEvent(true);

        window.addEventListener('resize', function(evt) {
          app.mainView.isClientActive = true;
          app.mainView.lastClientActivityTime = new Date().getTime();
          app.mainView.lastSaveTime = new Date().getTime();
          var e = evt.target;
          var obj = {
            name: 'client:' + app.mainView.serverTab + ':resize',
            time: new Date().getTime(),
            innerHeight: e.innerHeight,
            outerHeight: e.outerHeight,
            innerWidth: e.innerWidth,
            outerWidth: e.outerWidth,
            pageXOffset: e.pageXOffset,
            pageYOffset: e.pageYOffset,
            scrollMaxX: e.scrollMaxX,
            scrollMaxY: e.scrollMaxY,
            scrollX: e.scrollX,
            scrollY: e.scrollY,
            devicePixelRatio: e.devicePixelRatio,
            screenX: e.screenX,
            screenY: e.screenY,
            theWindow: {
              innerHeight: window.innerHeight,
              innerWidth: window.innerWidth,
              outerHeight: window.outerHeight,
              outerWidth: window.outerWidth,
              devicePixelRatio: window.devicePixelRatio,
              screenX: window.screenX,
              screenY: window.screenY,
            },
          }
        });
        window.addEventListener('wheel', function(e) {
          app.mainView.isClientActive = true;
          app.mainView.lastClientActivityTime = new Date().getTime();
          app.mainView.lastSaveTime = new Date().getTime();
          var obj = {
            name: 'client:' + app.mainView.serverTab + ':document:wheel',
            time: new Date().getTime(),
            layerX: e.layerX,
            layerY: e.layerY,
            clientX: e.clientX,
            clientY: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY,
            screenX: e.screenX,
            screenY: e.screenY,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            deltaMode: e.deltaMode,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
          };
        });
        document.addEventListener('mousemove', function(e) {
          app.mainView.isClientActive = true;
          app.mainView.lastClientActivityTime = new Date().getTime();
          app.mainView.lastSaveTime = new Date().getTime();
          var obj = {
            name: 'client:' + app.mainView.serverTab + ':document:mousemove',
            time: new Date().getTime(),
            layerX: e.layerX,
            layerY: e.layerY,
            clientX: e.clientX,
            clientY: e.clientY,
            type: 'notset',
          };
        }, true);
        document.addEventListener('mouseup', function(e) {
          app.mainView.isClientActive = true;
          app.mainView.lastClientActivityTime = new Date().getTime();
          var obj = {
            name: 'client:' + app.mainView.serverTab + ':document:mouseup',
            time: new Date().getTime(),
            layerX: e.layerX,
            layerY: e.layerY,
            clientX: e.clientX,
            clientY: e.clientY,
            type: 'notset',
          };
        }, true);
        var previousOriginalTarget = 'page';
        document.addEventListener('mouseout', function(e) {
          app.mainView.isClientActive = true;
          app.mainView.lastClientActivityTime = new Date().getTime();
          app.mainView.lastSaveTime = new Date().getTime();
          var obj = {
            name: 'client:' + app.mainView.serverTab + ':document:mouseout',
            time: new Date().getTime(),
            layerX: e.layerX,
            layerY: e.layerY,
            clientX: e.clientX,
            clientY: e.clientY,
            type: 'notset',
          };
        }, true);
        document.addEventListener('mousedown', function(e) {
          app.mainView.isClientActive = true;
          app.mainView.lastClientActivityTime = new Date().getTime();
          app.mainView.lastSaveTime = new Date().getTime();
          var obj = {
            name: 'client:' + app.mainView.serverTab + ':document:mousedown',
            time: new Date().getTime(),
            layerX: e.layerX,
            layerY: e.layerY,
            clientX: e.clientX,
            clientY: e.clientY,
            type: 'notset',
          };
        }, true);

        //Set window size
        window.dispatchEvent(new Event('resize'));

        //Start Animation loop
        app.mainView.goUpdate();

      });
    },
    goUpdate: function() {
      var lastTime = new Date().getTime();
      var nowTime = new Date().getTime();
      var dt = 0;
      var animate = function() {
        nowTime = new Date().getTime();
        dt = nowTime - lastTime;
        lastTime = nowTime;
        app.trackingView.animate(dt);
        requestAnimationFrame(animate);
      };
      animate();
    },
  });
}());