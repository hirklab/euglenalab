/* global app:true */
(function() {

  'use strict';
  app = app || {};

    caja.initialize({ cajaServer: 'http://caja.appspot.com' });

  // Helper functions are defined here.

  function rgb2hsv () {
      var rr, gg, bb,
          r = arguments[0] / 255,
          g = arguments[1] / 255,
          b = arguments[2] / 255,
          h, s,
          v = Math.max(r, g, b),
          diff = v - Math.min(r, g, b),
          diffc = function(c){
              return (v - c) / 6 / diff + 1 / 2;
          };

      if (diff == 0) {
          h = s = 0;
      } else {
          s = diff / v;
          rr = diffc(r);
          gg = diffc(g);
          bb = diffc(b);

          if (r === v) {
              h = bb - gg;
          }else if (g === v) {
              h = (1 / 3) + rr - bb;
          }else if (b === v) {
              h = (2 / 3) + gg - rr;
          }
          if (h < 0) {
              h += 1;
          }else if (h > 1) {
              h -= 1;
          }
      }
      return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          v: Math.round(v * 100)
      };
  }

  function getDistance(pointA, pointB) {
    return Math.sqrt((pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2);
  }

  function assignOldToNewPoints() {
    var newAssignment = {};
  
    /*
    currPositions: [],
    prevPositions: [],
    idToPosition: {},
    currID: 1,

    currPositions is always empty, prevPositions is populated, want
    to fill in idToPosition
    */

    //console.log(app.mainView.prevPositions);
    //console.log(app.mainView.currPositions);

    for (var id in app.mainView.idToPosition) {
      var oldPosition = app.mainView.idToPosition[id];
      var smallestDistance = 9999999;
      var newPosition = -1;
      for (var position in app.mainView.prevPositions) {
        var dist = getDistance(oldPosition, position);
        if (dist < smallestDistance) {
          smallestDistance = dist;
          newPosition = position;
        }
      }
      if (newPosition !== -1) {
        app.mainView.currPositions.push(newPosition);
        newAssignment[id] = newPosition;
        console.log(newAssignment[id]);
      }
    }
    // console.log(app.mainView.currPositions);
    //console.log(app.mainView.prevPositions);
    //console.log(app.mainView.idToPosition);

    app.mainView.idToPosition = Object.assign({}, newAssignment);
    return newAssignment; 
  }

  $(document).ready(function() {
    app.mainView = new app.MainView();

    // Kick user out if not using Chrome.
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome) {
      alert('This feature only works on Google Chrome!!! Navigating back to homepage.');
      location.href = '/account/';
    }

    //var myVar = setInterval(app.mainView.runLoop, 1);

    $.post('/account/developgame/gethelperfunctioncount/', {})
      .done(function(data0) {
        var helperFunctionCount = parseInt(data0);
        for (var i = 0; i < helperFunctionCount; i++) {
          $.post('/account/developgame/gethelperfunction/', { userName: app.mainView.userName,
                                                              helperIndex: i } )
              .done(function(data) {
                var helperArgs = data.split('-----')[0].split('&&&&&');
                var helperCode = data.split('-----')[1];
                var helperName = data.split('-----')[2];
                //console.log('args: ' + helperArgs);
                //console.log('code: ' + helperCode);
                //console.log('name: ' + helperName);
                app.mainView.parseHelperCode(helperCode, 
                                             helperArgs.toString().slice(0,-1),
                                             helperName);
              });

        }
      });

    document.onkeypress = function (e) {
      e = e || window.event;
      var code;
      if (!e) var e = window.event;
      if (e.keyCode) code = e.keyCode;
      else if (e.which) code = e.which;
      var character = String.fromCharCode(code);

      //console.log(e.ctrlKey);
      app.mainView.previousKey = character;

      if (!app.mainView.gameInSession) {
        return;
      }

      // Override default spacebar functionality.
      if (e.keyCode == 32) {
        e.preventDefault();
      }

      app.mainView.parseKeypressCode(app.mainView.gameKeypressCode, character);
    };

    app.mainView.helperFunctionEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeHelper'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.helperFunctionEditor.setLineClass(hlLineHelper, null, null);
          hlLineHelper = app.mainView.helperFunctionEditor.setLineClass(app.mainView.helperFunctionEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          $('#savedStatus').html("Unsaved Program");
        }
    });
    var hlLineHelper = app.mainView.helperFunctionEditor.setLineClass(0, "activeline");

    app.mainView.readmeEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeREADME'), {
        lineNumbers: false,
        theme: "text/html",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.readmeEditor.setLineClass(hlLineReadme, null, null);
          hlLineReadme = app.mainView.readmeEditor.setLineClass(app.mainView.readmeEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          var gameName = app.mainView.gameName;
          if (gameName === "avoidEuglenaGame.peter" || gameName === "euglenaHeatmaps.peter"
              || gameName === "helloWorld.peter" || gameName === "euglenaCountExperiment.peter"
              || gameName === "guessLedGame.peter" || gameName === "movingBoxGame.peter"
              || gameName === "userInteractionLogging.peter") {
            if (app.mainView.userName === undefined || app.mainView.userName === "undefined") {
              gameName += "_modified"
            } else {
              gameName += "_" + app.mainView.userName;
            }
          }
          $.post('/account/developgame/savereadme/', { userName: app.mainView.userName,
                                                       readmeText:  app.mainView.readmeEditor.getValue(),
                                                       fileName: app.mainView.gameName + "_README.txt" } )
              .done(function(data) {});
        }
    });
    var hlLineReadme = app.mainView.readmeEditor.setLineClass(0, "activeline");

    $.post('/account/developgame/savereadme/', { userName: app.mainView.userName,
                                                       readmeText:  app.mainView.readmeEditor.getValue(),
                                                       fileName: app.mainView.gameName + "_README.txt" } )
              .done(function(data) {});

    app.mainView.runEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeRun'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.runEditor.setLineClass(hlLineRun, null, null);
          hlLineRun = app.mainView.runEditor.setLineClass(app.mainView.runEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          $('#savedStatus').html("Unsaved Program");
        }
    });
    var hlLineRun = app.mainView.runEditor.setLineClass(0, "activeline");

    app.mainView.startEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeStart'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.startEditor.setLineClass(hlLineStart, null, null);
          hlLineStart = app.mainView.startEditor.setLineClass(app.mainView.startEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          $('#savedStatus').html("Unsaved Program");
        }
    });
    var hlLineStart = app.mainView.startEditor.setLineClass(0, "activeline");

    app.mainView.endEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeEnd'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.endEditor.setLineClass(hlLineEnd, null, null);
          hlLineEnd = app.mainView.endEditor.setLineClass(app.mainView.endEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          $('#savedStatus').html("Unsaved Program");
        }
    });
    var hlLineEnd = app.mainView.endEditor.setLineClass(0, "activeline");

    app.mainView.joystickEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeJoystick'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.joystickEditor.setLineClass(hlLineJoystick, null, null);
          hlLineJoystick = app.mainView.joystickEditor.setLineClass(app.mainView.joystickEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          $('#savedStatus').html("Unsaved Program");
        }
    });
    var hlLineJoystick = app.mainView.joystickEditor.setLineClass(0, "activeline");

    app.mainView.keypressEditor = CodeMirror.fromTextArea(document.getElementById('txtCodeKeypress'), {
        lineNumbers: false,
        theme: "default",
        autoMatchParens: true,
        lineWrapping: true,
        onCursorActivity: function() {
          app.mainView.keypressEditor.setLineClass(hlLineKeypress, null, null);
          hlLineKeypress = app.mainView.keypressEditor.setLineClass(app.mainView.keypressEditor.getCursor().line, null, "activeline");
        },
        onChange: function() {
          $('#savedStatus').html("Unsaved Program");
        }
    });
    var hlLineKeypress = app.mainView.keypressEditor.setLineClass(0, "activeline");

    $('#gameNameText').val(app.mainView.gameName);

    $('#btnSandboxMode').click(() => {app.mainView.sandboxMode = true});
    $('#btnStartGame').click(function() {
    app.mainView.runCodeFn = null; // todo: this makes app parse all the code again when starting again. Is this the most efficient way to do this?
        app.mainView.gameRunCode = app.mainView.runEditor.getValue();
      app.mainView.gameStartCode = app.mainView.startEditor.getValue();
      app.mainView.gameEndCode = app.mainView.endEditor.getValue();
      app.mainView.gameKeypressCode = app.mainView.keypressEditor.getValue();
      app.mainView.gameJoystickCode = app.mainView.joystickEditor.getValue();

      var codeRun = app.mainView.gameRunCode;
      var codeStart = app.mainView.gameStartCode;
      var codeEnd = app.mainView.gameEndCode;
      var codeJoystick = app.mainView.gameJoystickCode;
      var codeKeypress = app.mainView.gameKeypressCode;
      var nameUser = app.mainView.user;
      var gameName = app.mainView.gameName;
      if (gameName === "avoidEuglenaGame.peter" || gameName === "euglenaHeatmaps.peter"
          || gameName === "helloWorld.peter" || gameName === "euglenaCountExperiment.peter"
          || gameName === "guessLedGame.peter" || gameName === "movingBoxGame.peter"
          || gameName === "userInteractionLogging.peter") {
        if (app.mainView.userName === undefined || app.mainView.userName === "undefined") {
          gameName += "_modified"
        } else {
          gameName += "_" + app.mainView.userName;
        }
      }
      app.mainView.gameName = gameName;
      $('#gameNameText').val(app.mainView.gameName);

      $.post('/account/developgame/savereadme/', { userName: app.mainView.userName,
                                                       readmeText:  app.mainView.readmeEditor.getValue(),
                                                       fileName: gameName + "_README.txt" } )
              .done(function(data) {});
      $.post('/account/developgame/savefile/', { userName: app.mainView.userName,
                                                 runCode: codeRun,
                                                 startCode: codeStart,
                                                 endCode: codeEnd,
                                                 joystickCode: codeJoystick,
                                                 keypressCode: codeKeypress,
                                                 fileName: gameName } )
        .done(function(data) {
          //console.log( "Data Loaded savefile: " + data);
          $('#savedStatus').html("Program Saved");
          $('#loadedProgramTxt').html("Loaded Program: " + gameName);
        });

      app.mainView.gameInSession = true;
      $('#runningStatus').css('color', 'green');
      $('#runningStatus').html('Running');
      // app.mainView.codeVariablesEditor.setOption("readOnly", "nocursor");
      // app.mainView.runEditor.setOption("readOnly", "nocursor");
      // app.mainView.startEditor.setOption("readOnly", "nocursor");
      // app.mainView.endEditor.setOption("readOnly", "nocursor");
      // app.mainView.joystickEditor.setOption("readOnly", "nocursor");
      // app.mainView.keypressEditor.setOption("readOnly", "nocursor");
      $('#btnUpdateRun').prop("disabled", true);
      app.mainView.parseStartCode(app.mainView.gameStartCode);

      $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " started program ----- \n" } )
        .done(function(data) {
          //console.log( "Data Loaded log user data: " + data);
        });
    });

    $(".demographicData").change(function() {
      app.mainView.validateDemographicInfo();
    });

    $('#btnSaveDemographics').click(function() {
      app.mainView.validateDemographicInfo();
      app.mainView.fullName = $('#userNameText').val();
      app.mainView.age = $('#userAgeText').val();
      app.mainView.programExp = $("input:radio[name='optradio']:checked").val();
      app.mainView.jsExp = $("input:radio[name='optradio2']:checked").val();
      app.mainView.bioExp = $("input:radio[name='optradio3']:checked").val();
      $.post('/account/developgame/saveuserdemographicinfo/', { userName: app.mainView.userName,
                                                                fullName: app.mainView.fullName,
                                                                age: app.mainView.age,
                                                                programExp: app.mainView.programExp,
                                                                jsExp: app.mainView.jsExp,
                                                                bioExp: app.mainView.bioExp } )
        .done(function(data) {
          //console.log( "Data Loaded demographic data: " + data);
        });
    });

    $('#btnSaveHelper').click(function() {
      $('#helperArgsText').html($('#helperFunctionArgsInput').val());
      $('#helperNameText').html($('#helperFunctionNameInput').val());
      $('#txtCodeHelper').html(app.mainView.helperFunctionEditor.getValue());
      $('#helperFunctionArea').show();
      $("#saveHelperFunctionButton").html("Save Helper Function");
      app.mainView.parseHelperCode(app.mainView.helperFunctionEditor.getValue(), 
                                   $('#helperFunctionArgsInput').val(),
                                   $('#helperFunctionNameInput').val());
      $.post('/account/developgame/savehelperfunction/', { userName: app.mainView.userName,
                                                             functionCode:  app.mainView.helperFunctionEditor.getValue(),
                                                             functionName: $('#helperFunctionNameInput').val(),
                                                             functionArgs: $('#helperFunctionArgsInput').val().split(","),
                                                             fileName: app.mainView.gameName } )
              .done(function(data) {});
      $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " saving help function " + $('#helperFunctionNameInput').val() + " ----- \n" } )
        .done(function(data) {});
      app.mainView.helperFunctionShown = false;
    });

    $('#btnSwitchSandbox').click(function() {
      if (app.mainView.sandboxVideo) {
        $('#btnSwitchSandbox').html('Switch To Video Mode');
        app.mainView.sandboxVideo = false;
        $('#btnRecordVideoStream').hide();
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " switched to simulation sandbox mode ----- \n" } )
        .done(function(data) {});
      } else {
        $('#btnSwitchSandbox').html('Switch To Simulation Mode');
        app.mainView.sandboxVideo = true;
        $('#btnRecordVideoStream').show();
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " switched to video sandbox mode ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#btnRecordVideoStream').click(function() {
      if (app.mainView.sandboxVideoIsRecording) {
        $('#btnRecordVideoStream').html('Start Recording');
        app.mainView.sandboxVideoIsRecording = false;
        app.mainView.sandboxVideoPlaybackFrame = 1;
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " started recording sandbox video stream ----- \n" } )
        .done(function(data) {});
      } else {
        $('#btnRecordVideoStream').html('Stop Recording');
        app.mainView.sandboxFrame = 1;
        app.mainView.sandboxVideoIsRecording = true;
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " stopped recording sandbox video stream ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#helperFunctionArea').hide();
    $('#sandboxControls').hide();

    $('#txtChooseSandboxVideo').hide();
    $('#btnChooseSandboxVideo').hide();
    $('#btnRecordVideoStream').hide();

    $('#toggleHelperCodeSection').on({
      'click': function() {
        if (app.mainView.helperCodeExpanded) {
          app.mainView.helperCodeExpanded = false;
          $("#toggleHelperCodeSection").attr("src", "/media/arrow_right.jpg");
          $('#helperCodeRow').hide();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " closed helper function code box ----- \n" } )
            .done(function(data) {});
        } else {
          app.mainView.helperCodeExpanded = true;
          $("#toggleHelperCodeSection").attr("src", "/media/arrow_down.jpg");
          $('#helperCodeRow').show();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " opened helper function code box ----- \n" } )
            .done(function(data) {});
        }
      }
    });

    $('#toggleStartCodeSection').on({
      'click': function() {
        if (app.mainView.startCodeExpanded) {
          app.mainView.startCodeExpanded = false;
          $("#toggleStartCodeSection").attr("src", "/media/arrow_right.jpg");
          $('#startCodeRow').hide();
          $('#startComment').hide();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " opened start code box ----- \n" } )
            .done(function(data) {});
        } else {
          app.mainView.startCodeExpanded = true;
          $("#toggleStartCodeSection").attr("src", "/media/arrow_down.jpg");
          $('#startCodeRow').show();
          $('#startComment').show();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " closed start code box ----- \n" } )
            .done(function(data) {});
        }
      }
    });

    $('#toggleRunCodeSection').on({
      'click': function() {
        if (app.mainView.runCodeExpanded) {
          app.mainView.runCodeExpanded = false;
          $("#toggleRunCodeSection").attr("src", "/media/arrow_right.jpg");
          $('#runCodeRow').hide();
          $('#runComment').hide();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " opened run code box ----- \n" } )
            .done(function(data) {});
        } else {
          app.mainView.runCodeExpanded = true;
          $("#toggleRunCodeSection").attr("src", "/media/arrow_down.jpg");
          $('#runCodeRow').show();
          $('#runComment').show();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " closed run code box ----- \n" } )
            .done(function(data) {});
        }
      }
    });

    $('#toggleEndCodeSection').on({
      'click': function() {
        if (app.mainView.endCodeExpanded) {
          app.mainView.endCodeExpanded = false;
          $("#toggleEndCodeSection").attr("src", "/media/arrow_right.jpg");
          $('#endCodeRow').hide();
          $('#endComment').hide();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " opened end code box ----- \n" } )
            .done(function(data) {});
        } else {
          app.mainView.endCodeExpanded = true;
          $("#toggleEndCodeSection").attr("src", "/media/arrow_down.jpg");
          $('#endCodeRow').show();
          $('#endComment').show();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " closed end code box ----- \n" } )
            .done(function(data) {});
        }
      }
    });

    $('#toggleJoystickCodeSection').on({
      'click': function() {
        if (app.mainView.joystickCodeExpanded) {
          app.mainView.joystickCodeExpanded = false;
          $("#toggleJoystickCodeSection").attr("src", "/media/arrow_right.jpg");
          $('#joystickCodeRow').hide();
          $('#joystickComment').hide();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " opened joystick code box ----- \n" } )
            .done(function(data) {});
        } else {
          app.mainView.joystickCodeExpanded = true;
          $("#toggleJoystickCodeSection").attr("src", "/media/arrow_down.jpg");
          $('#joystickCodeRow').show();
          $('#joystickComment').show();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " closed joystick code box ----- \n" } )
            .done(function(data) {});

        }
      }
    });

    $('#toggleKeypressCodeSection').on({
      'click': function() {
        if (app.mainView.keypressCodeExpanded) {
          app.mainView.keypressCodeExpanded = false;
          $("#toggleKeypressCodeSection").attr("src", "/media/arrow_right.jpg");
          $('#keypressCodeRow').hide();
          $('#keypressComment').hide();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " opened keypress code box ----- \n" } )
            .done(function(data) {});
        } else {
          app.mainView.keypressCodeExpanded = true;
          $("#toggleKeypressCodeSection").attr("src", "/media/arrow_down.jpg");
          $('#keypressCodeRow').show();
          $('#keypressComment').show();
          $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " closed keypress code box ----- \n" } )
            .done(function(data) {});

        }
      }
    });

    $('#drawingFunctionsButton').click(function() {
      if ($('#drawingFunctionsButton').text() === "Show drawing functions") {
        $('#drawingFunctionsButton').html("Hide drawing functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " hiding drawing functions ----- \n" } )
        .done(function(data) {});
      } else {
        $('#drawingFunctionsButton').html("Show drawing functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " showing drawing functions ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#trackingFunctionsButton').click(function() {
      if ($('#trackingFunctionsButton').text() === "Show Euglena tracking functions") {
        $('#trackingFunctionsButton').html("Hide Euglena tracking functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " hiding Euglena tracking functions ----- \n" } )
        .done(function(data) {});
      } else {
        $('#trackingFunctionsButton').html("Show Euglena tracking functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " showing Euglena tracking functions ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#programControlFunctionsButton').click(function() {
      if ($('#programControlFunctionsButton').text() === "Show program control functions") {
        $('#programControlFunctionsButton').html("Hide program control functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " hiding program control functions ----- \n" } )
        .done(function(data) {});
      } else {
        $('#programControlFunctionsButton').html("Show program control functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " showing program control functions ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#euglenaControlFunctionsButton').click(function() {
      if ($('#euglenaControlFunctionsButton').text() === "Show Euglena control functions") {
        $('#euglenaControlFunctionsButton').html("Hide Euglena control functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " hiding Euglena control functions ----- \n" } )
        .done(function(data) {});
      } else {
        $('#euglenaControlFunctionsButton').html("Show Euglena control functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " showing Euglena control functions ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#fileFunctionsButton').click(function() {
      if ($('#fileFunctionsButton').text() === "Show file functions") {
        $('#fileFunctionsButton').html("Hide file functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " hiding file functions ----- \n" } )
        .done(function(data) {});
      } else {
        $('#fileFunctionsButton').html("Show file functions");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " showing file functions ----- \n" } )
        .done(function(data) {});
      }
    });

    $('#showConstantsButton').click(function() {
      if ($('#showConstantsButton').text() === "Show constants") {
        $('#showConstantsButton').html("Hide constants");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " hiding constants ----- \n" } )
        .done(function(data) {});
      } else {
        $('#showConstantsButton').html("Show constants");
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " showing constants ----- \n" } )
        .done(function(data) {});
      }
    });

    jQuery.fn.center = function () {
      //this.css("position","absolute");
      this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
                                                  $(window).scrollTop()) + "px");
      this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
                                                  $(window).scrollLeft()) + "px");
      return this;
    }

    jQuery.fn.uncenter = function() {;
      this.css("top", "0px");
      this.css("left", "0px");
      return this;
    }

    $('#btnDownloadInstructions').click(function(e) {
      e.preventDefault();
      window.open('/media/documents/EuglenaScriptUsageInstructions.pdf', '_blank');
    });

    $('#btnSubmitFeedback').click(function(e) {
      e.preventDefault();
      window.open('https://docs.google.com/forms/d/e/1FAIpQLSc16t_RYg7P5GXY-CJIyibj-aC5UfqxuDqHM6JCorLY5RFZiA/viewform', '_blank');
    });

    $('#btnHideCode').click(function() {
      if (app.mainView.isCodeShowing) {
        app.mainView.programTopCSS = $('#programDiv').css("top");
        app.mainView.programLeftCSS = $('#programDiv').css("left");
        $('#programDiv').removeClass('col-xs-5');
        $('#programDiv').addClass('col-xs-12');
        $('#btnHideCode').html('Show Code');
        $('#codeDiv').removeClass('col-xs-12');
        $('#codeDiv').addClass('col-xs-0');
        $('#codeDiv').hide();
        $('#apiInfo').hide();
        $('#pageFooter').hide();
        $('#btnShowAPI').hide();
        app.mainView.isCodeShowing = false;
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " is hiding all code ----- \n" } )
            .done(function(data) {});
      } else {
        $('#programDiv').removeClass('col-xs-12');
        $('#programDiv').addClass('col-xs-5');
        $('#btnHideCode').html('Hide Code');
        $('#codeDiv').removeClass('col-xs-0');
        $('#codeDiv').addClass('col-xs-7');
        $('#codeDiv').show();
        $('#apiInfo').show();
        $('#pageFooter').show();
        $('#btnShowAPI').show();
        app.mainView.isCodeShowing = true;
        $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " is showing all code ----- \n" } )
            .done(function(data) {});
      }
    });
    
    $('#btnStopGame').click(function() {
      app.mainView.gameInSession = false;
      app.mainView.sandboxMode = false;
      $('#runningStatus').css('color', 'red');
      $('#runningStatus').html('Stopped');
      var ledsSetObj = app.mainView.setLEDhelper(0, 0, 0, 0);
      ledsSetObj.rightValue = 0;
      ledsSetObj.leftValue = 0;
      ledsSetObj.upValue = 0;
      ledsSetObj.DownValue = 0;
      app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
      app.mainView.setInstructionText(" ");
      app.mainView.setJoystickVisible(true);
      app.mainView.codeEditorReadOnly = false;
      app.mainView.joystickIntensity = 0;
      app.mainView.joystickDirection = 0;
      // app.mainView.codeVariablesEditor.setOption("readOnly", false);
      // app.mainView.runEditor.setOption("readOnly", false);
      // app.mainView.startEditor.setOption("readOnly", false);
      // app.mainView.endEditor.setOption("readOnly", false);
      // app.mainView.joystickEditor.setOption("readOnly", false);
      // app.mainView.keypressEditor.setOption("readOnly", false);
      $('#btnUpdateRun').prop("disabled", false);
      app.mainView.parseStartCode(app.mainView.gameEndCode);

      $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " stopped program ----- \n" } )
        .done(function(data) {
          //console.log( "Data Loaded log user data: " + data);
        });
    });

    $('#btnSaveGame').click(function() {
      app.mainView.gameRunCode = app.mainView.runEditor.getValue();
      app.mainView.gameStartCode = app.mainView.startEditor.getValue();
      app.mainView.gameEndCode = app.mainView.endEditor.getValue();
      app.mainView.gameKeypressCode = app.mainView.keypressEditor.getValue();
      app.mainView.gameJoystickCode = app.mainView.joystickEditor.getValue();
      var codeRun = app.mainView.gameRunCode;
      var codeStart = app.mainView.gameStartCode;
      var codeEnd = app.mainView.gameEndCode;
      var codeJoystick = app.mainView.gameJoystickCode;
      var codeKeypress = app.mainView.gameKeypressCode;
      var nameUser = app.mainView.user;
      var gameName = $('#gameNameText').val();
      if (gameName === "avoidEuglenaGame.peter" || gameName === "euglenaHeatmaps.peter"
          || gameName === "helloWorld.peter" || gameName === "euglenaCountExperiment.peter"
          || gameName === "guessLedGame.peter" || gameName === "movingBoxGame.peter"
          || gameName === "userInteractionLogging.peter") {
        if (app.mainView.userName === undefined || app.mainView.userName === "undefined") {
          gameName += "_modified"
        } else {
          gameName += "_" + app.mainView.userName;
        }
      }
      app.mainView.gameName = gameName;
      $('#gameNameText').val(app.mainView.gameName);

      $.post('/account/developgame/savereadme/', { userName: app.mainView.userName,
                                                   readmeText:  app.mainView.readmeEditor.getValue(),
                                                   fileName: app.mainView.gameName + "_README.txt" } )
              .done(function(data) {});
      $.post('/account/developgame/savefile/', { userName: app.mainView.userName,
                                                 runCode: codeRun,
                                                 startCode: codeStart,
                                                 endCode: codeEnd,
                                                 joystickCode: codeJoystick,
                                                 keypressCode: codeKeypress,
                                                 fileName: app.mainView.gameName } )
        .done(function(data) {
          //console.log( "Data Loaded savefile: " + data);
          $('#loadedProgramTxt').html("Loaded Program: " + gameName);
          $('#savedStatus').html("Program Saved");
          alert('Game saved as: ' + gameName);
        });

      $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " saved program as " + gameName + " ----- \n" } )
        .done(function(data) {
          //console.log( "Data Loaded log user data: " + data);
        });
    });

    $(".helperFile").click(function() {
      var codeInd = $(this).index();

      $('#saveHelperFunctionButton').html("Save Helper Function");

      $('#loadHelperFunctionModal').modal('toggle');
      $.post('/account/developgame/gethelperfunction/', { userName: app.mainView.userName,
                                                          helperIndex: codeInd } )
        .done(function(data) {
          var helperArgs = data.split('-----')[0].split('&&&&&');
          var helperCode = data.split('-----')[1];
          var helperName = data.split('-----')[2];
          //console.log('args: ' + helperArgs);
          //console.log('code: ' + helperCode);
          //console.log('name: ' + helperName);
          app.mainView.helperFunctionEditor.setValue(helperCode);
          $('#helperArgsText').html(helperArgs.toString().slice(0,-1));
          $('#helperNameText').html(helperName);
          $('#txtCodeHelper').html(helperCode);
          app.mainView.parseHelperCode(helperCode, 
                                   helperArgs.toString().slice(0,-1),
                                   helperName);
          $.post('/account/developgame/loguserdata/', { userName: app.mainView.userName,
                                                        fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                        logTimestamp: Date.now().toString(),
                                                        logText: "User " + app.mainView.userName + " loaded helper function " + helperName + "----- \n" } )
            .done(function(data2) {
              $("#helperFunctionArea").show();
              $("#saveHelperFunctionButton").html("Save Helper Function");
            });
        });
    });

    $.post('/account/developgame/savereadme/', { userName: app.mainView.userName,
                                                 readmeText:  app.mainView.readmeEditor.getValue(),
                                                 fileName: app.mainView.gameName + "_README.txt" } )
              .done(function(data) {});

    $(".gameFile").click(function() {
        var codeInd = $(this).index();
        $.post('/account/developgame/getreadme/', { userName: app.mainView.userName,
                                                    gameIndex: codeInd } )
        .done(function(data) {
          if (data !== undefined && data != null) {
            if (data.length > 1) app.mainView.readmeEditor.setValue(data);
          }
        });
        $.post('/account/developgame/getgamecode/', { userName: app.mainView.userName,
                                                      gameIndex: codeInd } )
        .done(function(data) {
          //console.log( "Data Loaded readfile: ");
          var gameSections = data.split('-----');
          app.mainView.runEditor.setValue(gameSections[0]);
          app.mainView.startEditor.setValue(gameSections[1]);
          app.mainView.endEditor.setValue(gameSections[2]);
          app.mainView.joystickEditor.setValue(gameSections[3]);
          app.mainView.keypressEditor.setValue(gameSections[4]);

          var gameName = gameSections[5];
          app.mainView.gameName = gameName;
          $('#gameNameText').val(app.mainView.gameName);
          $.post('/account/developgame/loguserdata/', { userName: app.mainView.userName,
                                                        fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                        logTimestamp: Date.now().toString(),
                                                        logText: "User " + app.mainView.userName + " loaded program " + gameName + "----- \n" } )
            .done(function(data) {
              //console.log( "Data Loaded log user data: " + data);
              $('#loadGameModal').modal('toggle');
              $('#loadedProgramTxt').html("Loaded Program: " + gameName);
            });
        });
    });

    $('#txtSandboxMode').hide();

    //
    // Multi object tracking.
    //

    var count = 0;
    var h = 0;
    var s = 0;
    var v = 0;
    tracking.ColorTracker.registerColor('black', function(r, g, b) {
      // if (r < 100 && g < 100 && b < 100) return true;

      //return g == 255;
      
      // console.log(h);
      // console.log(s);
      // console.log("value");
      // count++;
      // if (count % 1000 === 0){
        var hsv = rgb2hsv(r,g,b);
        h = hsv.h;
        s = hsv.s;
        v = hsv.v;
      // }
      return (/*h<100 && s<=100 &&*/ v<=20);
    });

    app.mainView.colors = new tracking.ColorTracker(['black']);
    app.mainView.colors.setMinDimension(0.1);
    app.mainView.colors.setMaxDimension(625);
    app.mainView.colors.setMinGroupSize(0.1);

    console.log("track init's");
    app.mainView.colors.on('track', function(event) {
        console.log("track started");
      if (event.data.length === 0) {
        // No colors were detected in this frame.
      } else {
         // console.error(event.data.length);
        //console.warn(event.data);
            let individuals_new = {};
            let idsToAssign = Object.keys(app.mainView.individuals);

            let largestId = idsToAssign.reduce((a, b) => Math.max(a,b), 0); // maximum in array.
            let idToAssign = -1;
            for (let rect of event.data) {
                // Assign ids properly.
                if (idsToAssign.length) {
                    let chosenIndex = -1;
                    let chosenId = -1;
                    let closestDistance = 999999;
                    for (let index in idsToAssign) {
                        let id = idsToAssign[index];
                        let individual = app.mainView.individuals[id];
                        let distance = (individual.position.x - rect.x) ** 2 + (individual.position.y - rect.y) ** 2;
                        if (distance < closestDistance) {
                            chosenIndex = index;
                            chosenId = id;
                            closestDistance = distance;
                        }
                    }
                    idToAssign = chosenId;
                    idsToAssign.splice(chosenIndex, 1);
                }
                else {
                    // Create a new id.
                    largestId++;
                    idToAssign = largestId;
                }
                individuals_new[idToAssign] = {
                    position: {
                        x: rect.x,
                        y: rect.y
                    },
                    size: {
                        width: rect.width,
                        height: rect.height
                    }
                };
               //console.warn(rect);
            }
            //console.error(individuals_new);
            // Calculate velocity and acceleration now.
            let frame_time = performance.now();
            let dt = .001 * (frame_time - app.mainView.frame_time_prev);
            for (let id in individuals_new) {
                let individual = app.mainView.individuals[id];
                let individual_prev = app.mainView.individuals_prev[id];
                let individual_new = individuals_new[id];
                // console.error(id, individual, individual_prev, individual_new);
                individual_new.velocity = (individual && individual_prev && 'position' in individual_prev && 'position' in individual) ? {
                        x: (individual.position.x - individual_prev.position.x) / dt,
                        y: (individual.position.y - individual_prev.position.y) / dt
                    } : {x: 0, y: 0};
                individual_new.acceleration = (individual && individual_prev && 'velocity' in individual_prev && 'velocity' in individual) ? {
                        x: (individual.velocity.x - individual_prev.velocity.x) / dt,
                        y: (individual.velocity.y - individual_prev.velocity.y) / dt
                    } : {x: 0, y: 0};
            }
          app.mainView.individuals_prev = app.mainView.individuals;
          app.mainView.individuals = individuals_new;
          app.mainView.frame_time_prev = frame_time;

      /*  var ctx = document.getElementById("display").getContext("2d");
        ctx.strokeStyle = "red";

        app.mainView.prevPositions = [];
        app.mainView.prevPositions = app.mainView.currPositions.slice();
        app.mainView.currPositions = [];
       
        event.data.forEach(function(rect) {
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          if (app.mainView.firstObjectTrackingIteration || Object.keys(app.mainView.idToPosition).length < 1) {  
            app.mainView.idToPosition[app.mainView.currID] = {x: rect.x, y: rect.y};
            app.mainView.currID++;
          } 
          app.mainView.currPositions.push({x: rect.x, y: rect.y});
        });

        //app.mainView.idToPosition = assignOldToNewPoints();

        app.mainView.firstObjectTrackingIteration = false;
        */
      }
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

    bpuAddress: "",
    magnification: 0,

    gameSessionName: "no_name_assigned",
    sessionOverFirstTime: false,
    isAPIshowing: true,
    isCodeShowing: true,
    programTopCSS: 0,
    programLeftCSS: 0,
    fileWriteMode: 'FILE.APPEND',
    userName: "",
    fullName: "",
    age: "",
    programExp: "",
    jsExp: "",
    bioExp: "",

    gameErrorMessage: "",
    gameName: "guessLedGame.peter",
    previousKey: "",

    currentHelperFunctionCode: "",
    helperFunctionShown: false,

    helperCodeExpanded: true,
    startCodeExpanded: true,
    runCodeExpanded: true,
    endCodeExpanded: true,
    joystickCodeExpanded: true,
    keypressCodeExpanded: true,

    // Object tracking code.
    currPositions: [],
    prevPositions: [],
    individuals: {},
    individuals_prev: {},
    frame_time_prev: performance.now(),
    positionToId: {},
    idToPosition: {},
    idToVelocity: {},
    idToAcceleration: {},
    idToRotation: {},
    firstObjectTrackingIteration: false,
    currID: 1,


    // Sandbox mode.
    sandboxMode: false,
    sandboxFrame: 1,
    sandboxVideoPlaybackFrame: 1,
    sandboxVideo: false,
    sandboxVideoIsRecording: false,
    sandboxVideoHasRecorded: false,
    sandboxVideoName: "sandboxvideo",

    // GAME-RELATED VARIABLES
    gameFileNames: [],
    gameDrawOnTrackedEuglena: false,
    gameInstructionText: "This text can be changed with the API! Euglena move away from light. The joystick to the left of this text controls the LED lights. Try the current code or load one of our code samples. When you are done, please save your application with the 'Save Code' button below. Have fun!",
    gameOverText: "",
    gameJoystickView: true,
    gameInSession: false,
    gameRunCode: "",
    gameStartCode: "",
    gameEndCode: "",
    gameKeypressCode: "",
    gameJoystickCode: "",
    gameEuglenaCount: -1,
    gameDemoMode: false,

    // Joystick info.
    joystickDirection: 0,
    joystickIntensity: 0,

      runCodeFn: null,

    // getEuglenaInRect
    getEuglenaInRectUpperLeftX: 0, 
    getEuglenaInRectUpperLeftY: 0, 
    getEuglenaInRectLowerRightX: 0,
    getEuglenaInRectLowerRightY: 0,
    gameEuglenaInRectReturn: "",

    // getAllEuglenaPositions
    getAllEuglenaPositionsStr: "",

    // getAllEuglenaIDs
    getAllEuglenaIDsStr: "",

    // getEuglenaVelocityByID
    getEuglenaVelocityID: 0,
    getEuglenaVelocityReturn: "",
    getEuglenaVelocityCache: {},

    // getEuglenaAccelerationByID
    getEuglenaAccelerationID: 0,
    getEuglenaAccelerationReturn: "",
    getEuglenaAccelerationCache: {},

    // getEuglenaRotationByID
    getEuglenaRotationID: 0,
    getEuglenaRotationReturn: "",
    getEuglenaRotationCache: {},

    //Tag-Initialize
    initialize: function() {
      //Get Window Stats
      window.dispatchEvent(new Event('resize'));

      app.mainView = this;

      app.mainView.gameSessionName = JSON.parse(unescape($('#data-session').html()))["liveBpuExperiment"]["id"];
      app.mainView.userName = JSON.parse(unescape($('#data-user').html()))["username"];
      app.mainView.gameName = "guessLedGame.peter_" + app.mainView.userName;

      $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User " + app.mainView.userName + " started session ----- \n" } )
        .done(function(data) {
          //console.log( "Data Loaded log user data: " + data);
        });


      $.post('/account/developgame/isuserdemographicsaved/', { userName: app.mainView.userName } )
        .done(function(data) {
          if (data === "false") {
            $('#demographicDataModal').modal({
              backdrop: 'static',
              keyboard: false,
              show: true
            });
          }
        });

      app.mainView.user = new app.User(JSON.parse(unescape($('#data-user').html())));
      app.mainView.session = new app.Session(JSON.parse(unescape($('#data-session').html())));
      app.mainView.bpu = new app.User(JSON.parse(unescape($('#data-bpu').html())));
      app.mainView.bpuAddress = "http://" + JSON.parse(unescape($('#data-bpu').html()))["publicAddr"]["ip"] + ":" + JSON.parse(unescape($('#data-bpu').html()))["publicAddr"]["webcamPort"];
      app.mainView.ledsSetObj = new app.User(JSON.parse(unescape($('#data-setLedsObj').html())));
      app.mainView.bpuExp = new app.User(JSON.parse(unescape($('#data-bpuExp').html())));
      app.mainView.magnification = parseInt(JSON.parse(unescape($('#data-bpu').html()))["magnification"]);
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
    runLoop: function() { // This function is not called.

      /*
      This code is not called;
      if (app.mainView.gameInSession) {

        app.mainView.drawFns = [];
        // todo: better design to not have to recreate entire array each frame.

        app.mainView.parseRunCode(app.mainView.gameRunCode);
      }*/

      if (app.mainView.sandboxVideoIsRecording) {
        //console.log("saving frame...");
        app.mainView.sandboxFrame++;
        if (app.mainView.sandboxFrame % 50 === 0) {
          $.post('/account/developgame/saveframe/', { userName: app.mainView.userName,
                                                    bpuAddress:  app.mainView.bpuAddress,
                                                    imageNr: app.mainView.sandboxFrame / 50,
                                                    fileName: app.mainView.sandboxVideoName } )
              .done(function(data) {
                app.mainView.sandboxVideoHasRecorded = true;
              });

        }
      }
    },

    /*
     * Parsing functions.
     */
    generalParser: function(runCode, codeType, callback) {
      // Replace EuglenaScript functions with appropriate function calls.
      var modifiedCode = runCode;/*.split('setGameOverMessage').join('app.mainView.setGameOverMessage'); // Deprecated.

      // Remove unnecessary / potentially sinister code here (continuously expand list).
      modifiedCode = modifiedCode.split(/app.mainView./).join("");
      modifiedCode = modifiedCode.split(/app./).join("");

      // Expand
      modifiedCode = modifiedCode.split('drawCircle').join('app.mainView.drawCircle');
      modifiedCode = modifiedCode.split('drawLine').join('app.mainView.drawLine');
      modifiedCode = modifiedCode.split('drawOnTrackedEuglena').join('app.mainView.drawOnTrackedEuglena');
      modifiedCode = modifiedCode.split('drawRect').join('app.mainView.drawRect');
      modifiedCode = modifiedCode.split('drawText').join('app.mainView.drawText');
      modifiedCode = modifiedCode.split('endProgram').join('app.mainView.endProgram');

      modifiedCode = modifiedCode.split('getMaxScreenHeight').join('app.mainView.getMaxScreenHeight');
      modifiedCode = modifiedCode.split('getMaxScreenWidth').join('app.mainView.getMaxScreenWidth');
      modifiedCode = modifiedCode.split('getTimeLeft').join('app.mainView.getTimeLeft');
      modifiedCode = modifiedCode.split('readFromFile').join('app.mainView.readFromFile');
      modifiedCode = modifiedCode.split('setJoystickVisible').join('app.mainView.setJoystickVisible');
      modifiedCode = modifiedCode.split('setLED').join('app.mainView.setLED');
      modifiedCode = modifiedCode.split('setInstructionText').join('app.mainView.setInstructionText');
      modifiedCode = modifiedCode.split('writeToFile').join('app.mainView.writeToFile');*/

      // Replace EuglenaScript pre-defined constants with a string interpretable by JavaScript.
      // modifiedCode = modifiedCode.split('LED.RIGHT').join('\"LED.RIGHT\"');
      // modifiedCode = modifiedCode.split('LED.LEFT').join('\"LED.LEFT\"');
      // modifiedCode = modifiedCode.split('LED.UP').join('\"LED.UP\"');
      // modifiedCode = modifiedCode.split('LED.DOWN').join('\"LED.DOWN\"');

      modifiedCode = modifiedCode.split('FILE.OVERWRITE').join('\"FILE.OVERWRITE\"');
      modifiedCode = modifiedCode.split('FILE.APPEND').join('\"FILE.APPEND\"');

      modifiedCode = modifiedCode.split('MAX_SCREEN_WIDTH').join('639');
      modifiedCode = modifiedCode.split('MAX_SCREEN_HEIGHT').join('479');
      modifiedCode = modifiedCode.split('MAX_TEXT_SIZE').join('1.5');
      modifiedCode = modifiedCode.split('MAX_LED_INTENSITY').join('999');

      switch (codeType) {
          case "run":
              modifiedCode = "function runCode() {" + modifiedCode + "}; mainService.parseRunCode(runCode);";
              break;
          case "start":
          case "end":
          case "runOnce":
              modifiedCode = "function runOnceCode() {" + modifiedCode + "}; mainService.runOnce(runOnceCode);";
              break;
          case "onJoystickChange":
              modifiedCode = "function onJoystickChangeCode(angle, intensity) {" + modifiedCode + "}; mainService.onJoystickChange(onJoystickChangeCode);";
              break;
          case "onKeypress":
              modifiedCode = "function onKeypressCode(key) {" + modifiedCode + "}; mainService.onKeypress(onKeypressCode);";
              break;
          default:
              break;
      }

      try {
          caja.load(
              undefined,  // no DOM access
              undefined,  // no network access
              function(frame) {
                  frame.code(
                      null,  // dummy URL
                      'application/javascript',
                      modifiedCode)  // input source code
                      //.api(app.mainView)
                      .api(caja_api)
                      .run(function(result) {
                          //requestAnimationFrame(app.mainView.runLoop);
                          //console.warn("caja result"); // , modifiedCode, result);
                          if (callback) callback();
                      });
              });
      } catch (err) {
        app.mainView.gameInstructionText = 'There was an error in your code.';
        app.mainView.gameErrorMessage = 'There was an error in your code.';
        try {
          app.mainView.gameErrorMessage = err.message;
          app.mainView.gameInstructionText = err.message;
        } catch (err2) {}
        $('#btnUpdateRun').prop("disabled", false);
        $('#instructionText').text('Error in your code: ' + app.mainView.gameErrorMessage);
        $('#instructionText').css('color', 'red');
        app.mainView.gameInSession = false;
        $('#runningStatus').css('color', 'red');
        $('#runningStatus').html('Stopped');
        app.mainView.codeEditorReadOnly = false;
        app.mainView.runEditor.setOption("readOnly", false);
        app.mainView.startEditor.setOption("readOnly", false);
        app.mainView.endEditor.setOption("readOnly", false);
        app.mainView.joystickEditor.setOption("readOnly", false);
        app.mainView.keypressEditor.setOption("readOnly", false);
        return;
      }

      // $('#instructionText').text(app.mainView.gameInstructionText);
      // $('#instructionText').css('color', 'black');
      
    },
    parseRunCode: function(runCode, callback) {
      app.mainView.generalParser(runCode, "run", callback);
    },
    parseStartCode: function(runCode) {
      app.mainView.generalParser(runCode, "start");
    },
    parseEndCode: function(runCode) {
      app.mainView.generalParser(runCode, "end");
    },
    parseJoystickCode: function(runCode, angle, intensity) {
      //  todo: fix this.
      var modifiedCode = runCode.split('MAX_ANGLE').join('360');
      modifiedCode = modifiedCode.split('MAX_INTENSITY').join('1.0');
      modifiedCode = modifiedCode.split('angle').join((parseInt(angle) + 180).toString());
      modifiedCode = modifiedCode.split('intensity').join('\'' + intensity + '\'');
      app.mainView.generalParser(modifiedCode, "runOnce");
    },
    parseKeypressCode: function(runCode, key) {
      var modifiedCode = runCode.split('KEY.W').join('\'w\'');
      modifiedCode = modifiedCode.split('KEY.SPACE').join('\' \'');
      modifiedCode = modifiedCode.split('KEY.ZERO').join('\'0\'');
      modifiedCode = modifiedCode.split('KEY.ONE').join('\'1\'');
      modifiedCode = modifiedCode.split('KEY.TWO').join('\'2\'');
      modifiedCode = modifiedCode.split('KEY.THREE').join('\'3\'');
      modifiedCode = modifiedCode.split('KEY.FOUR').join('\'4\'');
      modifiedCode = modifiedCode.split('KEY.FIVE').join('\'5\'');
      modifiedCode = modifiedCode.split('KEY.SIX').join('\'6\'');
      modifiedCode = modifiedCode.split('KEY.SEVEN').join('\'7\'');
      modifiedCode = modifiedCode.split('KEY.EIGHT').join('\'8\'');
      modifiedCode = modifiedCode.split('KEY.NINE').join('\'9\'');
      modifiedCode = modifiedCode.split('KEY.A').join('\'a\'');
      modifiedCode = modifiedCode.split('KEY.S').join('\'s\'');
      modifiedCode = modifiedCode.split('KEY.D').join('\'d\'');
      modifiedCode = modifiedCode.split('KEY.C').join('\'c\'');
      modifiedCode = modifiedCode.split('KEY.Q').join('\'q\'');
      modifiedCode = modifiedCode.split('KEY.E').join('\'e\'');
      modifiedCode = modifiedCode.split('KEY.R').join('\'r\'');
      modifiedCode = modifiedCode.split('KEY.T').join('\'t\'');
      modifiedCode = modifiedCode.split('KEY.Y').join('\'y\'');
      modifiedCode = modifiedCode.split('KEY.U').join('\'u\'');
      modifiedCode = modifiedCode.split('KEY.I').join('\'i\'');
      modifiedCode = modifiedCode.split('KEY.O').join('\'o\'');
      modifiedCode = modifiedCode.split('KEY.P').join('\'p\'');
      modifiedCode = modifiedCode.split('KEY.F').join('\'f\'');
      modifiedCode = modifiedCode.split('KEY.G').join('\'g\'');
      modifiedCode = modifiedCode.split('KEY.H').join('\'h\'');
      modifiedCode = modifiedCode.split('KEY.J').join('\'j\'');
      modifiedCode = modifiedCode.split('KEY.K').join('\'k\'');
      modifiedCode = modifiedCode.split('KEY.L').join('\'l\'');
      modifiedCode = modifiedCode.split('KEY.Z').join('\'z\'');
      modifiedCode = modifiedCode.split('KEY.X').join('\'x\'');
      modifiedCode = modifiedCode.split('KEY.C').join('\'c\'');
      modifiedCode = modifiedCode.split('KEY.V').join('\'v\'');
      modifiedCode = modifiedCode.split('KEY.B').join('\'b\'');
      modifiedCode = modifiedCode.split('KEY.N').join('\'n\'');
      modifiedCode = modifiedCode.split('KEY.M').join('\'m\'');
      modifiedCode = modifiedCode.split('key').join('\'' + key + '\'');
      app.mainView.generalParser(modifiedCode, "runOnce");
    },
    parseHelperCode: function(helperCode, helperArgs, helperName) {
      var codeToParse = "var ";
      codeToParse += helperName;
      codeToParse += " = function(";
      codeToParse += helperArgs;
      codeToParse += ") { ";
      codeToParse += helperCode
      codeToParse += " }";
      //console.log("HELPER FUNCTION::::: " + codeToParse);
      //app.mainView.generalParser(codeToParse);
    },
    writeToFile: function(fileName, txt, mode) {
      //console.log('writeToFile function called.');
      $.post('/account/developgame/writeuserfile/', { fileName: fileName,
                                                 userText: txt,
                                                 fileMode: mode } )
        .done(function(data) {
          //console.log( "Data Loaded writeToFile: " + data);
        });
    },

    /*
     * Helper functions.
     */
    validateDemographicInfo: function() {
      var radio_buttons = $("input[name='optradio']");
      var radio_buttons2 = $("input[name='optradio2']");
      var radio_buttons3 = $("input[name='optradio3']");
      if ($('#userNameText').val() !== '' && $('#userAgeText').val() !== ''
        && radio_buttons.filter(':checked').length !== 0 
              && radio_buttons2.filter(':checked').length !== 0 
              && radio_buttons3.filter(':checked').length !== 0) {
        $("#btnSaveDemographics").prop("disabled", false);
      }
    },

    /*
     * Normal LiveLab functions.
     */
    alreadyKicked: false,
    kickUser: function(err, from) {
      //console.log('kicked from ' + from);
      // console.log('kick user loop');

      if (err) {
        return;
        console.log('kickUser', err, from);
      }

      if (!app.mainView.alreadyKicked) {
        app.mainView.alreadyKicked = true;
      } else {
        return;
      }

      // if (app.mainView.updateLoopInterval) {
      //   clearInterval(app.mainView.updateLoopInterval);
      //   app.mainView.updateLoopInterval = null;
      // }

      // if (app.mainView.keyboardTimeout) {
      //   clearTimeout(app.mainView.keyboardTimeout);
      //   app.mainView.keyboardTimeout = null;
      // }

      //console.log('kicking user!');
      // if (app.mainView.bpuExp != null) {
      //   app.mainView.showSurvey();
      //   console.log('bpuExp is null');
      // } else {

      // Entering sandbox mode.
      app.mainView.sandboxMode = true;
      $('#txtSandboxMode').show();
      $('#sandboxControls').show();
      // $('#btnUpdateRun').prop("disabled", true);
      // $('#btnStartGame').prop("disabled", true);
      // $('#btnStopGame').prop("disabled", true);
      // $('#btnLoadGame').prop("disabled", true);
      app.mainView.gameInSession = false;
      $('#runningStatus').css('color', 'red');
      $('#runningStatus').html('Stopped');
      app.mainView.gameInstructionText = 'So that other users can use the online microscope, your session has timed out. You are now in sandbox mode. Your code will run on the virtual simulation shown above. If you want to work with real Euglena again, please save your code and then return to the home page in order to join a new session.';
      alert(app.mainView.gameInstructionText);
      $('#instructionText').text(app.mainView.gameInstructionText);
      $('#instructionText').css('color', 'red');
      $.post('/account/developgame/loguserdata/', { fileName: app.mainView.userName + "_" + app.mainView.gameSessionName + ".txt",
                                                    logTimestamp: Date.now().toString(),
                                                    logText: "User session expired ----- \n" } )
        .done(function(data) {
          //console.log( "Data Loaded log user data: " + data);
        });
      //location.href = '/account/';
      // }
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
          //labelMsg += ' Sandbox Mode. Go to home page and select new microscope to start again.';
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
      setInstructionText: function(msgText) {
          //console.log('setLevelText function called.');
          app.mainView.gameInstructionText = msgText;
          $('#instructionText').text(app.mainView.gameInstructionText);
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

        // console.log("timeInLab:" + app.mainView.timeInLab);
        // console.log("timeForLab:" + app.mainView.timeForLab);



        // PW HACK: Make sure user isn't kicked from session if the time is negative before the session actually over.
        if (app.mainView.timeLeftInLab > 10000) {
          //console.log("SESSION OVER FIRST TIME");
          app.mainView.sessionOverFirstTime = true;
        }

        //Fail safe user kick. leds will not be set on bpu if bpu is done.
        //  this covers the case if the server does not properly inform the client of a lab over scenerio.
        if (app.mainView.sandboxMode || app.mainView.timeLeftInLab < 0) {
          //console.log('experiment over , kick user now' + app.mainView.timeLeftInLab);
          if (app.mainView.sessionOverFirstTime) {
            console.log('KICKING USER CODE');
            app.mainView.kickUser(null, 'complete');

            // clearInterval(app.mainView.updateLoopInterval);
            // app.mainView.updateLoopInterval = null;

            // clearTimeout(app.mainView.keyboardTimeout);
            // app.mainView.keyboardTimeout = null;
          }
          
        } 
        //else {
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
        //}

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
      setJoystickVisible: function(isOn) {
          //console.log('setJoystickVisible function called.');
          app.mainView.gameJoystickView = isOn;
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
              //console.log('keyboard loop');
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
  function parseColor(color) {
    if (~color.indexOf("COLORS.")) {
      color = color.replace("COLORS.", "");
    }
    else {
      color = "WHITE";
    }
    return color;
  }
  caja.whenReady(() => {
     /*for (let key in caja_api) {
         let value = caja_api[key];
         if (typeof value === "function") {
             caja.markFunction(value);
             caja_api[key] = caja.tame(value);
         }
    }*/
  });
   var caja_api = {
       mainService: {
           parseRunCode: function(fn) {
                if (app.mainView.gameInSession || app.mainView.sandboxMode)
                {
                    app.mainView.runCodeFn = fn;
                }
            },
           runOnce: function(fn) {
               fn();
           }
       },
      log: function(txt) {

          console.log(txt);
      },
      "this": {
          score: 0,
          currLED: "LED.LEFT"
      },
    drawCircle:  function(centerX, centerY, radius, color) {
        let ctx = document.getElementById("display").getContext( "2d" );
        ctx.strokeStyle = parseColor(color);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.closePath();
        ctx.stroke();

    },
       /*
        * Handle various function calls.
        */

       drawOnTrackedEuglena: function(isDrawing) {
           //console.log('drawOnTrackedEuglena function called.');
           app.mainView.gameDrawOnTrackedEuglena = isDrawing;
       },
       drawLine: function(x1, y1, x2, y2, color) {
           let ctx = document.getElementById("display").getContext( "2d" );
           ctx.strokeStyle = parseColor(color);
           ctx.beginPath();
           ctx.moveTo(x1, y1);
           ctx.lineTo(x2, y2);
           ctx.closePath();
           ctx.stroke();
       },
       drawRect: function(upperLeftX, upperLeftY, lowerRightX, lowerRightY, color) {
           let ctx = document.getElementById("display").getContext( "2d" );
           ctx.strokeStyle = parseColor(color);
           ctx.beginPath();
           ctx.rect(upperLeftX, upperLeftY, lowerRightX, lowerRightY);
           ctx.closePath();
           ctx.stroke();
       },
       drawText: function(drawTxt, xPos, yPos, size, color) {
           // todo: make size the last parameter (so it's optional).
           let ctx = document.getElementById("display").getContext( "2d" );
           if (typeof size != "number") size = 20;
           ctx.fillStyle = parseColor(color);
           ctx.font=size + "px Calibri";
           ctx.fillText(drawTxt, xPos, yPos);
       },
       endProgram: function() {
           $('#btnStopGame').click();
       },
       getAllEuglenaIDs: function() {
           return Object.keys(app.mainView.individuals);
       },
           getAllEuglenaIndividuals: () => app.mainView.individuals,
       getAllEuglenaPositions: () => Object.keys(app.mainView.individuals).map(k => app.mainView.individuals[k].position),
        getAllEuglenaVelocities: () => Object.keys(app.mainView.individuals).map(k => app.mainView.individuals[k].velocity),
        getAllEuglenaAccelerations: () => Object.keys(app.mainView.individuals).map(k => app.mainView.individuals[k].acceleration),
       getEuglenaCount: function() {
           //console.log('getEuglenaCount function called.');
           return Object.keys(app.mainView.individuals).length;
       },
       getEuglenaInRect: function(upperLeftX, upperLeftY, lowerRightX, lowerRightY) {
           // todo
           //console.log('getEuglenaInRect function called.');
           app.mainView.getEuglenaInRectUpperLeftX = upperLeftX;
           app.mainView.getEuglenaInRectUpperLeftY = upperLeftY;
           app.mainView.getEuglenaInRectLowerRightX = lowerRightX;
           app.mainView.getEuglenaInRectLowerRightY = lowerRightY;
           var idSet = new Set();
           var splitPositions = app.mainView.gameEuglenaInRectReturn.split(";");
           for (var i = 0; i < splitPositions.length; i++) {
               var token = splitPositions[i];
               if (token.length <= 0 || isNaN(token)) continue;
               idSet.add(parseInt(token));
           }
           return Array.from(idSet);
       },
       getEuglenaAcceleration: id => app.mainView.individuals[id].acceleration,
       getEuglenaPosition: id => app.mainView.individuals[id].position,
        getEuglenaVelocity: id => app.mainView.individuals[id].velocity,
        getEuglenaById: id => app.mainView.individuals[id],
       getEuglenaRotation: function(id) {
           // todo: app.mainView.individuals[id].rotation;
           app.mainView.getEuglenaRotationID = id;
           var idToRotation = {};
           var eachRotation = app.mainView.getEuglenaRotationReturn.split(';');
           for (var i = 0; i < eachRotation.length; i++) {
               var idAndItem = eachRotation[i].split(':');
               idToRotation[parseInt(idAndItem[0])] = parseFloat(idAndItem[1]);
               app.mainView.getEuglenaRotationCache[parseInt(idAndItem[0])] = parseFloat(idAndItem[1]);
           }
           if (id in idToRotation) {
               return idToRotation[id];
           } else if (id in app.mainView.getEuglenaRotationCache && app.mainView.getEuglenaRotationCache[id] !== -1) {
               return app.mainView.getEuglenaRotationCache[id];
           } else {
               return -1;
           }
       },
       getMaxScreenHeight: function() {
           //console.log('getMaxScreenHeight function called.');
           return 479;
       },
       getMaxScreenWidth: function() {
           //console.log('getMaxScreenWidth function called.');
           return 639;
       },
       getTimeLeft: function() {
           //console.log('getTimeLeft function called.');
           return Math.floor(app.mainView.timeLeftInLab / 1000.0);
       },
       readFromFile: function(fileName) {
           //console.log('readFromFile function called.');

           var txtData = "unchanged";
           $.ajax({
               type: 'POST',
               url: '/account/developgame/readuserfile/',
               data: { userFile: fileName },
               async:false
           }).done(function(data) {
               //console.log( "Data Loaded readFromFile: " + data);
               txtData = data;
               return txtData;
           });

           //console.log("Exiting function with data: " + txtData);
           return txtData;
       },
       setJoystickVisible: function(e) {
           app.mainView.setJoystickVisible(e);
       },
       setGameOverMessage: function(gameOverText) {
           //console.log('setGameOverMessage function called.');
           app.mainView.gameOverText = gameOverText;
       },
        LED: {
               RIGHT: "LED.RIGHT",
                   LEFT: "LED.LEFT",
                UP: "LED.UP",
                DOWN: "LED.DOWN"
        },
       setLED: function(led, intensity) {
           //console.log('setLED function called');
           //console.log(led);
           //console.log(intensity);

           // if (app.mainView.sandboxMode || !app.mainView.gameInSession) {
           //   return;
           // }

           app.mainView.joystickIntensity = intensity;

           switch (led) {
               case "LED.RIGHT":
                   app.mainView.joystickDirection = 0;
                   var ledsSetObj = app.mainView.setLEDhelper(0, intensity, 0, 0);
                   ledsSetObj.rightValue = parseInt(intensity);
                   app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
                   break;
               case 'LED.LEFT':
                   app.mainView.joystickDirection = 180;
                   var ledsSetObj = app.mainView.setLEDhelper(0, 0, 0, intensity);
                   ledsSetObj.leftValue = parseInt(intensity);
                   app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
                   break;
               case 'LED.UP':
                   app.mainView.joystickDirection = 90;
                   var ledsSetObj = app.mainView.setLEDhelper(intensity, 0, 0, 0);
                   ledsSetObj.topValue = parseInt(intensity);
                   app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
                   break;
               case 'LED.DOWN':
                   app.mainView.joystickDirection = 270;
                   var ledsSetObj = app.mainView.setLEDhelper(0, 0, intensity, 0);
                   ledsSetObj.bottomValue = parseInt(intensity);
                   app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, '');
                   break;
               default:
                   console.log('ERROR: led must be one of LEFT, RIGHT, UP, or DOWN', led, led == '"LED.RIGHT"');
           }
       },
       setInstructionText: function(msgText) {
           //console.log('setLevelText function called.');
           app.mainView.gameInstructionText = msgText;
           $('#instructionText').text(app.mainView.gameInstructionText);
       }

}


}());