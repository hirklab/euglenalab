/* global app:true */
(function() {
  'use strict';
  app = app || {};

  $(document).ready(function() {
    app.mainView = new app.MainView();

    var myVar = setInterval(app.mainView.runLoop, 1000);

    document.getElementById("txtCodeVariables").addEventListener("onfocus", function() {
      console.log('we are focused!');
    }, true);

    document.onkeypress = function (e) {
      if (!app.mainView.gameInSession) {
        return;
      }
      e = e || window.event;
      var code;
      if (!e) var e = window.event;
      if (e.keyCode) code = e.keyCode;
      else if (e.which) code = e.which;
      var character = String.fromCharCode(code);
      app.mainView.parseKeypressCode(app.mainView.gameKeypressCode, character);
    };

    var codeVariablesEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeVariables'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          codeVariablesEditor.setLineClass(hlLine, null, null);
          hlLine = codeVariablesEditor.setLineClass(codeVariablesEditor.getCursor().line, null, "activeline");
        }
    });
    var hlLine = codeVariablesEditor.setLineClass(0, "activeline");

    var runEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeRun'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          runEditor.setLineClass(hlLineRun, null, null);
          hlLineRun = runEditor.setLineClass(runEditor.getCursor().line, null, "activeline");
        }
    });
    var hlLineRun = runEditor.setLineClass(0, "activeline");

    var startEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeStart'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          startEditor.setLineClass(hlLineStart, null, null);
          hlLineStart = startEditor.setLineClass(startEditor.getCursor().line, null, "activeline");
        }
    });
    var hlLineStart = startEditor.setLineClass(0, "activeline");

    var endEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeEnd'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          endEditor.setLineClass(hlLineEnd, null, null);
          hlLineEnd = endEditor.setLineClass(endEditor.getCursor().line, null, "activeline");
        }
    });
    var hlLineEnd = endEditor.setLineClass(0, "activeline");

    var joystickEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeJoystick'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          joystickEditor.setLineClass(hlLineJoystick, null, null);
          hlLineJoystick = joystickEditor.setLineClass(joystickEditor.getCursor().line, null, "activeline");
        }
    });
    var hlLineJoystick = joystickEditor.setLineClass(0, "activeline");

    var keypressEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeKeypress'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          keypressEditor.setLineClass(hlLineKeypress, null, null);
          hlLineKeypress = keypressEditor.setLineClass(keypressEditor.getCursor().line, null, "activeline");
        }
    });
    var hlLineKeypress = keypressEditor.setLineClass(0, "activeline");

    // Handle new code.
    $('#btnUpdateRun').click(function() {
      app.mainView.gameGlobalVariables = codeVariablesEditor.getValue();
      app.mainView.gameRunCode = runEditor.getValue();
      app.mainView.gameStartCode = startEditor.getValue();
      app.mainView.gameEndCode = endEditor.getValue();
      app.mainView.gameKeypressCode = keypressEditor.getValue();
      app.mainView.gameJoystickCode = joystickEditor.getValue();
    });

    $('#btnStartGame').click(function() {
      app.mainView.gameInSession = true;
      codeVariablesEditor.setOption("readOnly", "nocursor");
      runEditor.setOption("readOnly", "nocursor");
      startEditor.setOption("readOnly", "nocursor");
      endEditor.setOption("readOnly", "nocursor");
      joystickEditor.setOption("readOnly", "nocursor");
      keypressEditor.setOption("readOnly", "nocursor");
      $('#btnUpdateRun').prop("disabled", true);
      app.mainView.parseGlobalVariables(app.mainView.gameGlobalVariables);
      app.mainView.parseStartCode(app.mainView.gameStartCode);
    });

    $('#btnStopGame').click(function() {
      app.mainView.gameInSession = false;
      app.mainView.codeEditorReadOnly = false;
      codeVariablesEditor.setOption("readOnly", false);
      runEditor.setOption("readOnly", false);
      startEditor.setOption("readOnly", false);
      endEditor.setOption("readOnly", false);
      joystickEditor.setOption("readOnly", false);
      keypressEditor.setOption("readOnly", false);
      $('#btnUpdateRun').prop("disabled", false);
    });

    $('#btnSaveGame').click(function() {
      var codeVar = app.mainView.gameGlobalVariables;
      var codeRun = app.mainView.gameRunCode;
      var codeStart = app.mainView.gameStartCode;
      var codeEnd = app.mainView.gameEndCode;
      var codeJoystick = app.mainView.gameJoystickCode;
      var codeKeypress = app.mainView.gameKeypressCode;
      var nameUser = app.mainView.user;
      var gameName = $('#gameNameText').val();
      $.post('/account/developgame/savefile/', { varCode: codeVar,
                                                 runCode: codeRun,
                                                 startCode: codeStart,
                                                 endCode: codeEnd,
                                                 joystickCode: codeJoystick,
                                                 keypressCode: codeKeypress,
                                                 fileName: gameName } )
        .done(function(data) {
          console.log( "Data Loaded: " + data);
        });
    });

    $('#btnLoadGame').click(function() {

    });


  });
  app.User = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/livelab/',
  });
  app.Session = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/livelab/'
  });



  app.MainView = Backbone.View.extend({
    el: '.page .container',
    events: {},
    hadJoyActivity: false,
    roughLabStartDate: null,
    isSocketInitialized: false,
    ledsSetObj: null,

    timeForLab: 0,
    timeInLab: 0,
    timeLeftInLab: 0,
    wasTimeSetFromUpdate: false,

    updateLoopInterval: null,

    // GAME-RELATED-VARIABLES
    gameDrawOnTrackedEuglena: false,
    gameLevel: 3,
    gameLevelText: {3: "Get 20% of the Euglena on the screen into the moving blue box at any given moment in time. The blue box will randomly move around the screen."},
    gameOverText: "",
    gameJoystickView: true,
    gameInSession: false,
    gameGlobalVariables: "",
    gameRunCode: "",
    gameStartCode: "",
    gameEndCode: "",
    gameKeypressCode: "",
    gameJoystickCode: "",
    gameJoystickCodeAngle: "",
    gameJoystickCodeIntensity: "",
    gameEuglenaCount: -1,
    gameDemoMode: false,

    // drawRect
    drawRectUpperLeftX: 0, 
    drawRectUpperLeftY: 0, 
    drawRectLowerRightX: 0, 
    drawRectLowerRightY: 0, 
    drawRectR: 0, 
    drawRectG: 0, 
    drawRectB: 0,

    // drawText
    drawTextdrawTxt: "", 
    drawTextXPos: 0, 
    drawTextYPos: 0, 
    drawTextSize: 0, 
    drawTextR: 0, 
    drawTextG: 0, 
    drawTextB: 0,

    // getEuglenaInRect
    getEuglenaInRectUpperLeftX: 0, 
    getEuglenaInRectUpperLeftY: 0, 
    getEuglenaInRectLowerRightX: 0,
    getEuglenaInRectLowerRightY: 0,
    gameEuglenaInRectCount: 0,

    // getAllEuglenaPositions
    getAllEuglenaPositionsStr: "",

    //Tag-Initialize
    initialize: function() {
      //Get Window Stats
      window.dispatchEvent(new Event('resize'));

      app.mainView = this;

      app.mainView.user = new app.User(JSON.parse(unescape($('#data-user').html())));
      app.mainView.session = new app.Session(JSON.parse(unescape($('#data-session').html())));
      app.mainView.bpu = new app.User(JSON.parse(unescape($('#data-bpu').html())));
      app.mainView.ledsSetObj = new app.User(JSON.parse(unescape($('#data-setLedsObj').html())));
      app.mainView.bpuExp = new app.User(JSON.parse(unescape($('#data-bpuExp').html())));
      app.mainView.bpuExp.attributes.exp_eventsToRun.sort(function(objA, objB) {
        return objB.time - objA.time;
      });

      //Set Lab Times
      //app.mainView.timeForLab = app.mainView.bpuExp.attributes.exp_eventsToRun[0].time;
      app.mainView.timeForLab = 100;
      app.mainView.setTimeLeftInLabLabel(app.mainView.timeForLab, 0, true);

      app.userSocketClient.setConnection(function(err, setLedsObj) {
        if (err) {
          app.mainView.isSocketInitialized = false;
          app.mainView.kickUser(err, 'initialize setConnection');
        } else {

          //My Objects
          app.mainView.myLightsObj.build(function(err, dat) {
            app.mainView.myJoyStickObj.build(function(err, dat) {
              app.mainView.isSocketInitialized = true;
              if (app.mainView.myJoyStickObj.doesExist) {
                app.mainView.myJoyStick.toggleJoystick('on');
                app.mainView.setupMouseEvents(function(err, dat) {
                  app.mainView.setupKeyboardEvents(function(err, dat) {
                    app.mainView.startUpdateLoop();
                  });
                });
              } else {
                app.mainView.setupKeyboardEvents(function(err, dat) {
                  app.mainView.startUpdateLoop();
                });
              }
            });
          });
        }
      });
    },

    /*
     * Game logic functions.
     */
    runLoop: function() {
      if (app.mainView.gameInSession) {
        app.mainView.parseRunCode(app.mainView.gameRunCode);
      }
    },

    /*
     * Parsing functions.
     */
    generalParser: function(runCode) {
      // TODO: Remove unnecessary code here.

      // Replace EuglenaScript functions with appropriate function calls.
      var modifiedCode = runCode.split('setGameOverMessage').join('app.mainView.setGameOverMessage');
      modifiedCode = modifiedCode.split('drawOnTrackedEuglena').join('app.mainView.drawOnTrackedEuglena');
      modifiedCode = modifiedCode.split('drawRect').join('app.mainView.drawRect');
      modifiedCode = modifiedCode.split('drawText').join('app.mainView.drawText');
      modifiedCode = modifiedCode.split('finishGame').join('app.mainView.finishGame');
      modifiedCode = modifiedCode.split('getAllEuglenaPositions').join('app.mainView.getAllEuglenaPositions');
      modifiedCode = modifiedCode.split('getEuglenaCount').join('app.mainView.getEuglenaCount');
      modifiedCode = modifiedCode.split('getEuglenaInRect').join('app.mainView.getEuglenaInRect');
      modifiedCode = modifiedCode.split('setJoystickView').join('app.mainView.setJoystickView');
      modifiedCode = modifiedCode.split('setLED').join('app.mainView.setLED');
      modifiedCode = modifiedCode.split('setLevel').join('app.mainView.setLevel');
      modifiedCode = modifiedCode.split('setTextPerLevel').join('app.mainView.setTextPerLevel');
      

      // Replace EuglenaScript pre-defined constants with a string interpretable by JavaScript.
      modifiedCode = modifiedCode.split('LED.RIGHT').join('\"LED.RIGHT\"');
      modifiedCode = modifiedCode.split('LED.LEFT').join('\"LED.LEFT\"');
      modifiedCode = modifiedCode.split('LED.UP').join('\"LED.UP\"');
      modifiedCode = modifiedCode.split('LED.DOWN').join('\"LED.DOWN\"');

      // TODO: CAREFULLY DETERMINE WHEN CODE SHOULD BE EVALUATED LOCALLY VS. GLOBALLY!!!!!
      //eval(modifiedCode);
      $.globalEval(modifiedCode);
    },
    parseGlobalVariables: function(runCode) {
      app.mainView.generalParser(runCode);
    },
    parseRunCode: function(runCode) {
      app.mainView.generalParser(runCode);
    },
    parseStartCode: function(runCode) {
      app.mainView.generalParser(runCode);
    },
    parseEndCode: function(runCode) {
      app.mainView.generalParser(runCode);
    },
    parseJoystickCode: function(runCode, angle, intensity) { 
      var modifiedCode = runCode.split('angle').join(angle);
      modifiedCode = modifiedCode.split('intensity').join('\'' + intensity + '\'');
      app.mainView.generalParser(modifiedCode);
    },
    parseKeypressCode: function(runCode, key) {
      var modifiedCode = runCode.split('KEY.W').join('\'w\'');
      modifiedCode = modifiedCode.split('KEY.SPACE').join('\' \'');
      modifiedCode = modifiedCode.split('KEY.A').join('\'a\'');
      modifiedCode = modifiedCode.split('KEY.S').join('\'s\'');
      modifiedCode = modifiedCode.split('KEY.D').join('\'d\'');
      modifiedCode = modifiedCode.split('KEY.C').join('\'c\'');
      modifiedCode = modifiedCode.split('key').join('\'' + key + '\'');
      app.mainView.generalParser(modifiedCode);
    },

    /*
     * Handle various function calls.
     */

    drawOnTrackedEuglena: function(isDrawing) {
      console.log('drawOnTrackedEuglena function called.');
      app.mainView.gameDrawOnTrackedEuglena = isDrawing;
    },
    drawRect: function(upperLeftX, upperLeftY, lowerRightX, lowerRightY, R, G, B) {
      console.log('drawRect function called.');
      app.mainView.drawRectUpperLeftX = upperLeftX;
      app.mainView.drawRectUpperLeftY = upperLeftY;
      app.mainView.drawRectLowerRightX = lowerRightX;
      app.mainView.drawRectLowerRightY = lowerRightY;
      app.mainView.drawRectR = R;
      app.mainView.drawRectG = G;
      app.mainView.drawRectB = B;
    },
    drawText: function(drawTxt, xPos, yPos, size, R, G, B) {
      console.log('drawText function called.');
      app.mainView.drawTextdrawTxt = drawTxt;
      app.mainView.drawTextXPos = xPos;
      app.mainView.drawTextYPos = yPos;
      app.mainView.drawTextSize = size;
      app.mainView.drawTextR = R;
      app.mainView.drawTextG = G;
      app.mainView.drawTextB = B;
    },
    finishGame: function() {
      console.log('finishGame function called.');
      app.mainView.gameInSession = false;
      app.mainView.parseEndCode(app.mainView.gameEndCode);
    },
    getAllEuglenaPositions: function() {
      console.log('getAllEuglenaPositions function called.');
      var allEuglenaPositions = [];
      var splitPositions = app.mainView.getAllEuglenaPositionsStr.split(";");
      for (var i = 0; i < splitPositions.length; i++) {
        var token = splitPositions[i];
        if (token.length <= 0) continue;
        var xPos = parseInt(token.split(",")[0].split("(")[1]);
        var yPos = parseInt(token.split(",")[1].split(")")[0]);
        allEuglenaPositions.push({x: xPos, y: yPos});
      }
      return allEuglenaPositions;
    },
    getEuglenaCount: function() {
      console.log('getEuglenaCount function called.');
      return app.mainView.gameEuglenaCount;
    },
    getEuglenaInRect: function(upperLeftX, upperLeftY, lowerRightX, lowerRightY) {
      console.log('getEuglenaInRect function called.');
      app.mainView.getEuglenaInRectUpperLeftX = upperLeftX;
      app.mainView.getEuglenaInRectUpperLeftY = upperLeftY;
      app.mainView.getEuglenaInRectLowerRightX = lowerRightX;
      app.mainView.getEuglenaInRectLowerRightY = lowerRightY;
      // TODO: There may be a lag before the actual value is processed in C++. Find a way to delay while processing.
      return app.mainView.gameEuglenaInRectCount;
    },
    setJoystickView: function(isOn) {
      console.log('setJoystickView function called.');
      app.mainView.gameJoystickView = isOn;
    },
    setGameOverMessage: function(gameOverText) {
      console.log('setGameOverMessage function called.');
      app.mainView.gameOverText = gameOverText;
    },
    setLED: function(led, intensity) {
      console.log('setLED function called');
      console.log(led);
      console.log(intensity);
      switch (led.split('.')[1]) {
        case 'RIGHT':
          var ledsSetObj = app.mainView.setLEDhelper(0, intensity, 0, 0);
          ledsSetObj.rightValue = parseInt(intensity);
          app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
          break;
        case 'LEFT':
          var ledsSetObj = app.mainView.setLEDhelper(0, 0, 0, intensity);
          ledsSetObj.leftValue = parseInt(intensity);
          app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
          break;
        case 'UP':
          var ledsSetObj = app.mainView.setLEDhelper(intensity, 0, 0, 0);
          ledsSetObj.topValue = parseInt(intensity);
          app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
          break;
        case 'DOWN':
          var ledsSetObj = app.mainView.setLEDhelper(0, 0, intensity, 0);
          ledsSetObj.bottomValue = parseInt(intensity);
          app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
          break;
        default:
          console.log('ERROR: led must be one of LEFT, RIGHT, UP, or DOWN');
      }
    },
    setLEDhelper: function(top, right, bottom, left) {
      var point = app.mainView.myJoyStick.getXyFromLightValues({topValue: top, rightValue: right, bottomValue: bottom, leftValue: left}, '');
      var ledsSetObj = app.mainView.getLedsSetObj();
      ledsSetObj.metaData.clientTime = new Date().getTime();
      ledsSetObj.metaData.layerX = point.x;
      ledsSetObj.metaData.layerY = point.y;
      ledsSetObj.metaData.touchState = app.mainView.myJoyStickObj.touchState;
      ledsSetObj.metaData.radius = 0;
      ledsSetObj.metaData.angle = 0;
      ledsSetObj.topValue = top;
      ledsSetObj.rightValue = right;
      ledsSetObj.bottomValue = bottom;
      ledsSetObj.leftValue = left;
      return ledsSetObj;
    },
    setTextPerLevel: function(level, levelText) {
      console.log('setLevelText function called.');
      app.mainView.gameLevelText[level] = levelText;
    },
    setLevel: function(level) {
      console.log('setLevel function called.');
      $('#level').text(level);
      $('#levelText').text(app.mainView.gameLevelText[level]);
      app.mainView.gameLevel = level;
    },


    /*
     * Normal LiveLab functions.
     */
    alreadyKicked: false,
    kickUser: function(err, from) {
      console.log('kicked from ' + from);
      // console.log('kick user loop');

      if (err) console.log('kickUser', err, from);

      $('#myVideo')[0].src = $('#myVideo')[0].src.replace('stream', 'snapshot');

      if (!app.mainView.alreadyKicked) {
        app.mainView.alreadyKicked = true;
      }

      if (app.mainView.updateLoopInterval) {
        clearInterval(app.mainView.updateLoopInterval);
        app.mainView.updateLoopInterval = null;
      }

      if (app.mainView.keyboardTimeout) {
        clearTimeout(app.mainView.keyboardTimeout);
        app.mainView.keyboardTimeout = null;
      }

      if (app.mainView.bpuExp != null) {
        //app.mainView.showSurvey();
        console.log('bpuExp is null');
      } else {
        location.href = '/account/';
      }
    },
    getLedsSetObj: function() {
      if (app.mainView.ledsSetObj === null) {
        return null;
      } else {
        return JSON.parse(JSON.stringify(app.mainView.ledsSetObj));
      }
    },
    setLedsFromLightValues: function(lightValues, evtType, previousTouchState) {
      var point = app.mainView.myJoyStick.getXyFromLightValues(lightValues, previousTouchState + '->setLedsFromLightValues');

      var ledsSetObj = app.mainView.getLedsSetObj();
      ledsSetObj.metaData.clientTime = new Date().getTime();

      ledsSetObj.metaData.layerX = point.x;
      ledsSetObj.metaData.layerY = point.y;

      ledsSetObj.metaData.evtType = evtType;
      ledsSetObj.metaData.touchState = app.mainView.myJoyStickObj.touchState;
      ledsSetObj.metaData.previousTouchState = previousTouchState;

      ledsSetObj.metaData.radius = 0;
      ledsSetObj.metaData.angle = 0;

      ledsSetObj.topValue = 0;
      ledsSetObj.rightValue = 0;
      ledsSetObj.bottomValue = 0;
      ledsSetObj.leftValue = 0;

      app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, previousTouchState + '->setLedsFromLightValues');
    },
    lastSetLedsFromEventDate: new Date().getTime(),
    setLedsFromEventInterval: 30,
    setLedsFromEvent: function(evt, evtType, previousTouchState) {
      var ledsSetObj = app.mainView.getLedsSetObj();
      ledsSetObj.metaData.clientTime = new Date().getTime();

      ledsSetObj.metaData.layerX = evt.layerX;
      ledsSetObj.metaData.layerY = evt.layerY;
      ledsSetObj.metaData.clientX = evt.clientX;
      ledsSetObj.metaData.clientY = evt.clientY;
      ledsSetObj.metaData.className = evt.target.className;

      ledsSetObj.metaData.evtType = evtType;
      ledsSetObj.metaData.touchState = app.mainView.myJoyStickObj.touchState;
      ledsSetObj.metaData.previousTouchState = previousTouchState;

      app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, previousTouchState + '->setLedsFromEvent');
    },
    setLedsFromObjectAndSendToServer: function(ledsSetObj, from) {

      //Rest Values
      ledsSetObj.metaData.radius = 0;
      ledsSetObj.metaData.angle = 0;

      ledsSetObj.topValue = 0;
      ledsSetObj.rightValue = 0;
      ledsSetObj.bottomValue = 0;
      ledsSetObj.leftValue = 0;
      ledsSetObj = app.mainView.myJoyStick.setLightValuesFromXY(ledsSetObj, from + '->setLedsFromObjectAndSendToServer');
      app.mainView.myLightsObj.update(ledsSetObj);

      //only update bpu on interval
      var newDate = new Date();
      if ((newDate - app.mainView.lastSetLedsFromEventDate) >= app.mainView.setLedsFromEventInterval) {
        app.mainView.lastSetLedsFromEventDate = newDate;
        app.userSocketClient.ledsSet(ledsSetObj);
      }
    },

    //From Socket
    setTimeLeftInLabLabel: function(timeLeft, dt, isReal) {
      if (isReal) {
        app.mainView.timeLeftInLab = timeLeft;
      } else {
        app.mainView.timeLeftInLab -= dt;
      }
      app.mainView.timeInLab += dt;
      var labelMsg = 'Remaining time in session:';
      if (app.mainView.timeLeftInLab > 0) {
        if (app.mainView.timeLeftInLab === null) {
          labelMsg += 'unknown' + ' seconds.';
        } else {
          var timeLeftSec = Math.round(app.mainView.timeLeftInLab / 1000);
          if (app.mainView.wasTimeSetFromUpdate) {
            labelMsg += timeLeftSec + ' seconds.';
          } else {
            labelMsg += '~' + timeLeftSec + ' seconds.';
          }
        }
      } else {
        if (isReal || app.mainView.wasTimeSetFromUpdate) {
          labelMsg += ' Lab Over.';
          // setTimeout(function() {
          //   clearInterval(app.mainView.updateLoopInterval);
          //   app.mainView.updateLoopInterval = null;

          //   clearTimeout(app.mainView.keyboardTimeout);
          //   app.mainView.keyboardTimeout = null;
          // }, 1);
        } else if (app.mainView.wasTimeSetFromUpdate) {
          labelMsg += '0' + ' seconds.';
        } else {
          labelMsg += '~0' + ' seconds.';
        }
      }
      var label = app.mainView.$el.find('[name="' + 'timeLeftInLab' + '"]')[0];
      if (label) label.innerHTML = labelMsg + '<br>';
    },

    //Tag-UpdateLoop
    startUpdateLoop: function() {
      var frameTime = new Date().getTime();
      var lastFrameTime = frameTime;
      var deltaFrame = frameTime - lastFrameTime;
      var timerActivatedJoystick = 0;
      //Update Loop
      app.mainView.updateLoopInterval = setInterval(function() {
        frameTime = new Date().getTime();
        deltaFrame = frameTime - lastFrameTime;
        lastFrameTime = frameTime;
        timerActivatedJoystick += deltaFrame;
        //Set time left in lab
        app.mainView.setTimeLeftInLabLabel(null, deltaFrame, false);

        //console.log("timeInLab:" + app.mainView.timeInLab);
        //console.log("timeForLab:" + app.mainView.timeForLab);



        //Fail safe user kick. leds will not be set on bpu if bpu is done.
        //  this covers the case if the server does not properly inform the client of a lab over scenerio.
        if (app.mainView.timeLeftInLab < 0) {
          // console.log('experiment over , kick user now');
          // app.mainView.kickUser(null, 'complete');

          // clearInterval(app.mainView.updateLoopInterval);
          // app.mainView.updateLoopInterval = null;

          // clearTimeout(app.mainView.keyboardTimeout);
          // app.mainView.keyboardTimeout = null;
        } else {
          if (app.mainView.isSocketInitialized && !app.mainView.hadJoyActivity) {
            if (timerActivatedJoystick > 1000) {
              timerActivatedJoystick = 0;
              if (app.mainView.myJoyStick.canvas.className === 'canvas-joystick-off') {
                app.mainView.myJoyStick.toggleJoystick('on');
              } else {
                app.mainView.myJoyStick.toggleJoystick('off');
              }
            }
          } else {
            timerActivatedJoystick = 0;
          }
        }
        app.mainView.myJoyStick.update('Joystick');
      }, 20);
    },
    //Tag-Joystick
    myJoyStick: null,
    myJoyStickObj: {
      touchState: 'up',
      doesExist: false,
      build: function(cb_fn) {
        if (app.mainView.$el.find('[name="' + 'myJoystick' + '"]')[0]) {
          app.mainView.myJoyStickObj.doesExist = true;
          app.mainView.myJoyStick = new Canvas_Joystick(app.mainView.$el.find('[name="' + 'myJoystick' + '"]')[0]);
        }
        cb_fn(null, null);
      },
    },
    //Tag-Lights
    myLights: null,
    myLightsObj: {
      doesExist: false,
      build: function(cb_fn) {
        if (app.mainView.$el.find('[name="' + 'myTopLight' + '"]')[0] && app.mainView.$el.find('[name="' + 'myRightLight' + '"]')[0] &&
          app.mainView.$el.find('[name="' + 'myBottomLight' + '"]')[0] && app.mainView.$el.find('[name="' + 'myLeftLight' + '"]')[0]) {
          app.mainView.myLightsObj.doesExist = true;
          app.mainView.myLights = {};
          app.mainView.myLights.top = app.mainView.$el.find('[name="' + 'myTopLight' + '"]')[0];
          app.mainView.myLights.right = app.mainView.$el.find('[name="' + 'myRightLight' + '"]')[0];
          app.mainView.myLights.bottom = app.mainView.$el.find('[name="' + 'myBottomLight' + '"]')[0];
          app.mainView.myLights.left = app.mainView.$el.find('[name="' + 'myLeftLight' + '"]')[0];
        }
        cb_fn(null, null);
      },
      update: function(data) {
        if (app.mainView.myLightsObj.doesExist) {
          app.mainView.myLights.top.style.backgroundColor = 'rgba(255,255,0,' + data.topValue / 100 + ')';
          app.mainView.myLights.right.style.backgroundColor = 'rgba(255,255,0,' + data.rightValue / 100 + ')';
          app.mainView.myLights.bottom.style.backgroundColor = 'rgba(255,255,0,' + data.bottomValue / 100 + ')';
          app.mainView.myLights.left.style.backgroundColor = 'rgba(255,255,0,' + data.leftValue / 100 + ')';

          app.mainView.myLights.top.innerHTML = data.topValue;
          app.mainView.myLights.right.innerHTML = data.rightValue;
          app.mainView.myLights.bottom.innerHTML = data.bottomValue;
          app.mainView.myLights.left.innerHTML = data.leftValue;
        }
      },
    },
    //Mouse Keyboard Event Controller
    zeroLeds: {
      topValue: 0,
      rightValue: 0,
      bottomValue: 0,
      leftValue: 0
    },
    lastMouseMoveTime: new Date().getTime(),

    //Events Router
    setLedsEventController: function(evt, evtType) {
      var previousTouchState = '' + app.mainView.myJoyStickObj.touchState;
      if (evtType === 'mousedown') {
        app.mainView.hadJoyActivity = true;

        app.mainView.myJoyStick.toggleJoystick('on');
        app.mainView.myJoyStickObj.touchState = 'down';
        //Set Leds
        app.mainView.setLedsFromEvent(evt, evtType, previousTouchState);

      } else if (evtType === 'mousemove') {

        if (app.mainView.myJoyStickObj.touchState === 'down' && new Date().getTime() - app.mainView.lastMouseMoveTime > 20) {
          app.mainView.lastMouseMoveTime = new Date().getTime();
          //Set Leds
          app.mainView.setLedsFromEvent(evt, evtType, previousTouchState);
        }

      } else if (evtType === 'mouseout') {
        app.mainView.myJoyStickObj.touchState = 'up';
        app.mainView.myJoyStick.toggleJoystick('off');
        //Set Leds
        app.mainView.setLedsFromLightValues(app.mainView.zeroLeds, evtType, previousTouchState);

      } else if (evtType === 'mouseup') {
        app.mainView.myJoyStickObj.touchState = 'up';
        app.mainView.myJoyStick.toggleJoystick('off');
        //Set Leds
        app.mainView.setLedsFromLightValues(app.mainView.zeroLeds, evtType, previousTouchState);

      } else if (evtType === 'resize') {
        app.mainView.myJoyStickObj.touchState = 'up';
        app.mainView.myJoyStick.toggleJoystick('off');
        //Set Leds
        app.mainView.setLedsFromLightValues(app.mainView.zeroLeds, evtType, previousTouchState);

      } else if (evtType === 'myJoyKeys_loop') { //event is light values
        app.mainView.myJoyStick.toggleJoystick('on');
        app.mainView.setLedsFromLightValues(evt, evtType, previousTouchState);
      }
    },

    //Tag-Keyboard
    myJoyKeys: null,
    setupKeyboardEvents: function(cb_fn) {
      app.mainView.myJoyKeys = {
        updateTime: 20,
        deltaValue: 2,
        areKeysRunning: false,
        runKeys: function() {
          var me = app.mainView.myJoyKeys;
          if (!this.areKeysRunning) {
            this.areKeysRunning = true;
            var loop = function() {
              app.mainView.keyboardTimeout = setTimeout(function() {
                if (me.keys.space.isDown) {
                  loop();
                } else {
                  //Top
                  if (me.keys.top.isDown && me.keys.bottom.value === 0) {
                    if (me.keys.top.value < 100) {
                      me.keys.top.value += me.deltaValue;
                    }
                  } else if (me.keys.top.value > 0) {
                    me.keys.top.value -= me.deltaValue;
                  } else {
                    //Bottom
                    if (me.keys.bottom.isDown) {
                      if (me.keys.bottom.value < 100) {
                        me.keys.bottom.value += me.deltaValue;
                      }
                    } else if (me.keys.bottom.value > 0) {
                      me.keys.bottom.value -= me.deltaValue;
                    }
                  }
                  //Right
                  if (me.keys.right.isDown && me.keys.left.value === 0) {
                    if (me.keys.right.value < 100) {
                      me.keys.right.value += me.deltaValue;
                    }
                  } else if (me.keys.right.value > 0) {
                    me.keys.right.value -= me.deltaValue;
                  } else {
                    //Left
                    if (me.keys.left.isDown) {
                      if (me.keys.left.value < 100) {
                        me.keys.left.value += me.deltaValue;
                      }
                    } else if (me.keys.left.value > 0) {
                      me.keys.left.value -= me.deltaValue;
                    }
                  }
                  var lightValues = {};
                  lightValues.topValue = me.keys.top.value;
                  lightValues.bottomValue = me.keys.bottom.value;
                  lightValues.rightValue = me.keys.right.value;
                  lightValues.leftValue = me.keys.left.value;
                  if (lightValues.topValue + lightValues.bottomValue + lightValues.rightValue + lightValues.leftValue > 0) {
                    app.mainView.setLedsEventController(lightValues, 'myJoyKeys_loop', app.mainView.myJoyStickObj.touchState);
                    loop();
                  } else {
                    app.mainView.setLedsEventController(lightValues, 'myJoyKeys_loop', app.mainView.myJoyStickObj.touchState);
                    app.mainView.setLedsFromLightValues(lightValues);
                    me.areKeysRunning = false;
                  }
                }
              }, me.updateTime);
            };

            if (app.mainView.updateLoopInterval != null) {
              console.log('keyboard loop');
              loop();
            }
          }
        },
        keys: {
          top: {
            pairName: '83',
            name: 'top',
            key: 'w',
            code: 87,
            isMaster: true,
            isDown: false,
            value: 0
          },
          bottom: {
            pairName: '87',
            name: 'bottom',
            key: 's',
            code: 83,
            isMaster: false,
            isDown: false,
            value: 0
          },
          right: {
            pairName: '65',
            name: 'right',
            key: 'd',
            code: 68,
            isMaster: true,
            isDown: false,
            value: 0
          },
          left: {
            pairName: '68',
            name: 'left',
            key: 'a',
            code: 65,
            isMaster: false,
            isDown: false,
            value: 0
          },
          space: {
            pairName: null,
            name: 'space',
            key: 'a',
            code: 32,
            isMaster: true,
            isDown: false,
            value: 0
          },
        }
      };
      // document.addEventListener('keydown', function(event) {
      //   if (app.mainView.myJoyStickObj.touchState !== 'down') {
      //     Object.keys(app.mainView.myJoyKeys.keys).forEach(function(item) {
      //       if (event.keyCode == app.mainView.myJoyKeys.keys[item].code) {
      //         app.mainView.myJoyKeys.keys[item].isDown = true;
      //         app.mainView.myJoyKeys.runKeys();
      //       }
      //     });
      //   }
      // });
      // document.addEventListener('keyup', function(event) {
      //   if (app.mainView.myJoyStickObj.touchState !== 'down') {
      //     Object.keys(app.mainView.myJoyKeys.keys).forEach(function(item) {
      //       if (event.keyCode == app.mainView.myJoyKeys.keys[item].code) {
      //         app.mainView.myJoyKeys.keys[item].isDown = false;
      //         app.mainView.myJoyKeys.runKeys();
      //       }
      //     });
      //   }
      // });
      cb_fn(null, null);
    },
    //Tag-Mouse
    setupMouseEvents: function(cb_fn) {
      //Events
      window.addEventListener('resize', function(evt) {
        //Resize Joystick Canvas
        var joystickCanvas = app.mainView.$el.find('[name="' + 'myJoystick' + '"]')[0];
        if (joystickCanvas && app.mainView.myJoyStick) {
          app.mainView.myJoyStick.resize(joystickCanvas.clientWidth, joystickCanvas.clientHeight);
        }
        app.mainView.setLedsEventController(evt, 'resize');
      });
      document.addEventListener('mousemove', function(evt) {
        if (app.mainView.isSocketInitialized && app.mainView.hadJoyActivity) {
          if (evt.target.className === 'canvas-joystick-on' || evt.target.className === 'canvas-joystick-off') {
            app.mainView.setLedsEventController(evt, 'mousemove');
          }
        }
      }, true);
      document.addEventListener('mousedown', function(evt) {
        if (app.mainView.isSocketInitialized) {
          if (evt.target.className === 'canvas-joystick-on' || evt.target.className === 'canvas-joystick-off') {
            app.mainView.setLedsEventController(evt, 'mousedown');
          }
        }
      }, true);
      document.addEventListener('mouseup', function(evt) {
        if (app.mainView.isSocketInitialized && app.mainView.hadJoyActivity) {
          app.mainView.setLedsEventController(evt, 'mouseup');
        }
      }, true);
      document.addEventListener('mouseout', function(evt) {
        if (app.mainView.isSocketInitialized && app.mainView.hadJoyActivity) {
          if (evt.target.className === 'page') {
            app.mainView.setLedsEventController(evt, 'mouseout');
          }
        }
      }, true);

      window.dispatchEvent(new Event('resize'));
      cb_fn(null, null);
    },
  });
}());