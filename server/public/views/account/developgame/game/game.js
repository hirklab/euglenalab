      var statusElement = document.getElementById('status');
      var progressElement = document.getElementById('progress');
      var spinnerElement = document.getElementById('spinner');

      var Module = {
        preRun: [],
        postRun: [],
        print: (function() {
          var element = document.getElementById('output');
          if (element) element.value = ''; // clear browser cache
          return function(text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            // These replacements are necessary if you render to raw HTML
            //text = text.replace(/&/g, "&amp;");
            //text = text.replace(/</g, "&lt;");
            //text = text.replace(/>/g, "&gt;");
            //text = text.replace('\n', '<br>', 'g');
            console.log(text);
            if (element) {
              element.value += text + "\n";
              element.scrollTop = element.scrollHeight; // focus on bottom
            }
          };
        })(),
        printErr: function(text) {
          if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
          if (0) { // XXX disabled for safety typeof dump == 'function') {
            dump(text + '\n'); // fast, straight to the real console
          } else {
            console.error(text);
          }
        },
        canvas: (function() {
          var canvas = document.getElementById('processed');

          // As a default initial behavior, pop up an alert when webgl context is lost. To make your
          // application robust, you may want to override this behavior before shipping!
          // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
          canvas.addEventListener("webglcontextlost", function(e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

          return canvas;
        })(),
        setStatus: function(text) {
          if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
          if (text === Module.setStatus.text) return;
          var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
          var now = Date.now();
          if (m && now - Date.now() < 30) return; // if this is a progress update, skip it if too soon
          if (m) {
            text = m[1];
            progressElement.value = parseInt(m[2])*100;
            progressElement.max = parseInt(m[4])*100;
            progressElement.hidden = false;
            spinnerElement.hidden = false;
          } else {
            progressElement.value = null;
            progressElement.max = null;
            progressElement.hidden = true;
            if (!text) spinnerElement.style.display = 'none';
          }
          statusElement.innerHTML = text;
        },
        totalDependencies: 0,
        monitorRunDependencies: function(left) {
          this.totalDependencies = Math.max(this.totalDependencies, left);
          Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
        },
        onRuntimeInitialized: function() {
          ImageProcModule = {
            postMessage: Module.cwrap('postMessage', null, ['number'])
          };
          //Module._foobar(); // foobar was exported
        }
      };
      Module.setStatus('Downloading...');
      window.onerror = function(event) {
        // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
        Module.setStatus('Exception thrown, see JavaScript console');
        spinnerElement.style.display = 'none';
        Module.setStatus = function(text) {
          if (text) Module.printErr('[post-exception status] ' + text);
        };
      };


      var URL_WASM =  "/views/account/developgame/game/ImageProc/image_proc.wasm";
      var URL_JS = "/views/account/developgame/game/ImageProc/image_proc.js";
      updateStatus( 'LOADING...' );
       fetch(URL_WASM).then(response =>
          response.arrayBuffer()
          ).then(buffer => {

        Module.wasmBinary = buffer;

        var script = document.createElement('script');
        script.src = URL_JS;
        script.onload = function() {
          console.log("Emscripten boilerplate loaded.");
          /*ImageProcModule = {
            postMessage: Module.cwrap('postMessage', null, ['int'])
          };*/
          //Module.cwrap('postMessage', null, ['number'])(2);
          updateStatus();
          processNextImage();
        }
        document.body.appendChild(script);
      });
// Global handle to module
var ImageProcModule = null;

var samplePeriod = 60; // ms

var startTime;
var endTime;
var averageProcessingPeriod = 0;
var averageFramePeriod = samplePeriod;
var ewmaSmooth = 0.3;

var imageData;
var imageNr = 0; // Serial number of current image

var imageCacheSize = 67;

var downloaded = new Array();
var downloadPaused = true;
var transferPaused = true;

//console.log("Starting browser detection!!!");

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
  alert("DEMO GAME ACTIVATED!!!");
  if (app.mainView.gameDemoMode) {
    app.mainView.gameDemoMode = false;
  } else {
    app.mainView.gameDemoMode = true;
  }
}

function enableDownload()
{
    fetchNextImage = function()
    {
      downloadedPaused = false;
      imageOnLoad = function()
      {
        downloaded.push( this );

        if( transferPaused ){
          enableTransfer();
        }

        if( downloaded.length < imageCacheSize ){
          fetchNextImage();
        }else{
          console.log("Download paused");
          downloadPaused = true;
        }
      }
      var img = new Image();
      img.onload = imageOnLoad;
      img.src = app.mainView.bpuAddress + "/?action=snapshot&n=" + (++imageNr);
      console.log("Game's BPU ADDRESS: " + img.src);
      img.crossOrigin = "Anonymous";
    }

    if (downloadPaused){
      fetchNextImage();
    }
}

function enableTransfer()
{
  var display = document.getElementById("display");
  var ctx = display.getContext( "2d" );

  drawNext = function()
  {
    transferPaused = false;
    if ( downloaded.length > 0 ){
      var img = downloaded.shift();
      enableDownload();
      ctx.drawImage(img,0,0);
      setTimeout(drawNext,samplePeriod);
    }
    else{
      console.log("Transfer stalled");
      transferPaused = true;
    }
  }

  if (transferPaused ){
    drawNext();
  }
}


function pageDidLoad() {
  //console.log("Page is loading...")
  //getVideoSources();

  /*ImageProcModule = document.getElementById( "image_proc" );
  var listener = document.getElementById("listener");
  updateStatus("Loading");
  listener.addEventListener("message", handleMessage, true );
  if ( ImageProcModule == null ) {
    updateStatus( 'LOADING...' );
  } else {
    updateStatus();
  }*/
  //processNextImage();
}

function getDataFromImage( img ) {
  // Get image data from specified canvas
  var display = document.getElementById("display");
  var ctx = display.getContext( "2d" );

  ctx.drawImage(img,0,0)
  var height = display.height;
  var width = display.width;
  var nBytes = height * width * 4;
  var pixels = ctx.getImageData(0, 0, width, height);
  var imData = { width: width, height: height, data: pixels.data.buffer };
  return imData;
}

function processNextImage()
{
  imageOnLoad = function()
  {
    imData = getDataFromImage(this);
    var cmd = { cmd: "process",
                width: imData.width,
                height: imData.height,
                data: imData.data,
                gameEndMsg: app.mainView.gameOverText,
                gameInSession: app.mainView.gameInSession,
                gameDemoMode: app.mainView.gameDemoMode,
                gameDrawOnTrackedEuglena: app.mainView.gameDrawOnTrackedEuglena,
                magnification: app.mainView.magnification,
                sandboxMode: app.mainView.sandboxMode,
                sandboxVideo: app.mainView.sandboxVideo,
                sandboxVideoHasRecorded: app.mainView.sandboxVideoHasRecorded,
                joystickIntensity: app.mainView.joystickIntensity,
                joystickDirection: app.mainView.joystickDirection,
                // drawCircle
                drawCircleCenterX: app.mainView.drawCircleCenterX,
                drawCircleCenterY: app.mainView.drawCircleCenterY,
                drawCircleRadius: app.mainView.drawCircleRadius,
                drawCircleR: app.mainView.drawCircleR,
                drawCircleG: app.mainView.drawCircleG,
                drawCircleB: app.mainView.drawCircleB,
                // drawLine
                drawLineX1: app.mainView.drawLineX1,
                drawLineY1: app.mainView.drawLineY1,
                drawLineX2: app.mainView.drawLineX2,
                drawLineY2: app.mainView.drawLineY2,
                drawLineR: app.mainView.drawLineR,
                drawLineG: app.mainView.drawLineG,
                drawLineB: app.mainView.drawLineB,
                // drawRect
                drawRectUpperLeftX: app.mainView.drawRectUpperLeftX, 
                drawRectUpperLeftY: app.mainView.drawRectUpperLeftY, 
                drawRectLowerRightX: app.mainView.drawRectLowerRightX, 
                drawRectLowerRightY: app.mainView.drawRectLowerRightY, 
                drawRectR: app.mainView.drawRectR, 
                drawRectG: app.mainView.drawRectG, 
                drawRectB: app.mainView.drawRectB,
                // drawText
                drawTextdrawTxt: app.mainView.drawTextdrawTxt,
                drawTextXPos: app.mainView.drawTextXPos,
                drawTextYPos: app.mainView.drawTextYPos,
                drawTextSize: app.mainView.drawTextSize,
                drawTextR: app.mainView.drawTextR,
                drawTextG: app.mainView.drawTextG,
                drawTextB: app.mainView.drawTextB,
                // getEuglenaInRect
                getEuglenaInRectUpperLeftX: app.mainView.getEuglenaInRectUpperLeftX,
                getEuglenaInRectUpperLeftY: app.mainView.getEuglenaInRectUpperLeftY,
                getEuglenaInRectLowerRightX: app.mainView.getEuglenaInRectLowerRightX,
                getEuglenaInRectLowerRightY: app.mainView.getEuglenaInRectLowerRightY,
                // getEuglenaAccelerationByID
                getEuglenaAccelerationID: app.mainView.getEuglenaAccelerationID,
                // getEuglenaPositionByID
                getEuglenaPositionID: app.mainView.getEuglenaPosID,
                // getEuglenaRotationByID
                getEuglenaRotationID: app.mainView.getEuglenaRotationID,
                // getEuglenaVelocityByID
                getEuglenaVelocityID: app.mainView.getEuglenaVelocityID,

                processor: "Euglena" };
    startTime = performance.now();
    ImageProcModule.postMessage( cmd );
  }

  var img = new Image();
  img.onload = imageOnLoad;
  img.src = app.mainView.bpuAddress + "/?action=snapshot&n=" + (++imageNr);

  if (app.mainView.sandboxMode && app.mainView.sandboxVideo && app.mainView.sandboxVideoHasRecorded && !app.mainView.sandboxVideoIsRecording) {
    var displayedFrame = app.mainView.sandboxVideoPlaybackFrame % parseInt(Math.floor(app.mainView.sandboxFrame/50.0)) + 1;
    //console.log(displayedFrame + '---' + app.mainView.sandboxFrame);
    img.src = "/media/videos/" + app.mainView.userName + "-frame-" + app.mainView.sandboxVideoName + "-" + displayedFrame + ".jpg";
    app.mainView.sandboxVideoPlaybackFrame++;
    if (app.mainView.sandboxVideoPlaybackFrame >= app.mainView.sandboxFrame) {
      app.mainView.sandboxVideoPlaybackFrame = 1;
    }
  }

  img.crossOrigin = "Anonymous";
}

function drawImage(pixels){
    var processed = document.getElementById("processed");
    var ctx = processed.getContext( "2d" );
    var imData = ctx.getImageData(0,0,processed.width,processed.height);
    var buf8 = new Uint8ClampedArray( pixels );
    imData.data.set( buf8 );
    ctx.putImageData( imData, 0, 0);
}

var lastTime = 0;
function handleMessage(msg) {
  var res = msg.data;
  if ( res.Type == "gamedata" ) {
    app.mainView.gameEuglenaCount = parseInt(res.TotalEuglena);
    app.mainView.gameEuglenaInRectReturn = res.EuglenaInRect;
    app.mainView.getAllEuglenaPositionsStr = res.EuglenaPositionsStr;
    app.mainView.getAllEuglenaIDsStr = res.EuglenaIDsStr;
    app.mainView.getEuglenaAccelerationReturn = res.EuglenaAccelerationReturn;
    app.mainView.getEuglenaPositionReturn = res.EuglenaPositionReturn;
    app.mainView.getEuglenaVelocityReturn = res.EuglenaVelocityReturn;
    app.mainView.getEuglenaRotationReturn = res.EuglenaRotationReturn;
  }
  if ( res.Type == "completed" ) {
    if ( res.Data ) {
      endTime = performance.now();
      averageProcessingPeriod = (1-ewmaSmooth)*averageProcessingPeriod + ewmaSmooth*(endTime-startTime);

      if( lastTime > 0 ){
        averageFramePeriod = (1-ewmaSmooth)*averageFramePeriod + ewmaSmooth*(endTime-lastTime);
        updateStatus( 'Processing time ' + (averageProcessingPeriod).toFixed(1) + 'ms\n'  + " Frame Time: " + averageFramePeriod.toFixed(1) + "ms");
      }

      lastTime = endTime;

      drawImage( res.Data );
      isReadyToReceive = true;
      // var delay = samplePeriod - (endTime - startTime);
      // if(delay > 0 ){
      //   setTimeout(processNextImage,delay)
      // }
      // else{
      //   processNextImage();
      // }
      processNextImage();
    } else {
      updateStatus( "Received something unexpected");
    }
  }

}

function updateStatus( optMessage ) {
  if (optMessage)
    statusText = optMessage;
  var statusField = document.getElementById("statusField");
  if (statusField) {
    statusField.innerHTML = " : " + statusText;
  }
}

