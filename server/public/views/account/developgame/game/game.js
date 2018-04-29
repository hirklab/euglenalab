// Global handle to module
var ImageProcModule = null;

var samplePeriod = 60; // ms

var startTime;
var endTime;
var averageProcessingPeriod = 0;
var averageFramePeriod = samplePeriod;
var ewmaSmooth = 0.3;

var imageData;
//var imageNr = 0; // Serial number of current image

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
      //img.src = app.mainView.bpuAddress + "/?action=snapshot&n=" + (++app.mainView.imageNr);
      img.src = app.mainView.bpuAddress + "/?action=snapshot&n=" + (++app.mainView.imageNr);

      console.log("Game's BPU ADDRESS: " + img.src);
      //img.crossOrigin = "Anonymous";
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
  ImageProcModule = document.getElementById( "image_proc" );
  // var listener = document.getElementById("listener");
  updateStatus("Loading");
  // listener.addEventListener("message", handleMessage, true );
  if ( ImageProcModule == null ) {
    updateStatus( 'LOADING...' );
  } else {
    updateStatus();
  }
  processNextImage();
}

function getDataFromImage( img ) {
  // Get image data from specified canvas
  var display = document.getElementById("display");
  var ctx = display.getContext( "2d" );

  ctx.drawImage(img,0,0);
  var height = display.height;
  var width = display.width;
  var nBytes = height * width * 4;
  var pixels = ctx.getImageData(0, 0, width, height);
  var imData = { width: width, height: height, data: pixels.data.buffer };
  return imData;
}

let loop_iteration = 0;
let sandbox_ellipses = [];

function processNextImage()
{
  imageOnLoad = function()
  {
    imData = getDataFromImage(this);
    /*var cmd = { cmd: "process",
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

                imageNr: app.mainView.imageNr,

                processor: "Euglena" };

    */
    startTime = performance.now();
    drawFromCode();

  }
    function drawFromCode() {
      // console.log(app.mainView.ledsSetObj);
        if (app.mainView.gameInSession || app.mainView.sandboxMode) {
        //if (app.mainView.gameInSession && !app.mainView.sandboxMode) {
            loop_iteration++;
            if (loop_iteration % 20 == 0)
                tracking.track('#display', app.mainView.colors); // todo: should this be done every time? perhaps reuse this or only run this every few frames.

            if (!app.mainView.runCodeFn) {
                console.log("Parsing code anew");
                app.mainView.parseRunCode(app.mainView.gameRunCode, drawFromCode);
                // todo: run this function less often, only whenever the code changes.
                return;
            }
            else {
                let display = document.getElementById("display");
                let ctx = display.getContext("2d");
                app.mainView.runCodeFn();
            }
        }
        requestAnimationFrame(processNextImage);
    }

    if (!app.mainView.sandboxMode) {
        var img = new Image();
        img.onload = imageOnLoad;
        img.src = app.mainView.bpuAddress + "/?action=snapshot&n=" + (++app.mainView.imageNr);
        //img.src = 'http://171.65.103.23:20030/?action=snapshot&n=' + (++app.mainView.imageNr);
        img.crossOrigin = "Anonymous";
        //img.crossOrigin = "Anonymous";
    }
    else if (app.mainView.sandboxMode) {
        let display = document.getElementById("display");
        let ctx = display.getContext("2d");
        if (!sandbox_ellipses.length) {
            for (let i = 0; i < 50; i++) {
                sandbox_ellipses.push({rotation: Math.random() *  Math.PI, position: {x: Math.random() * display.width , y: Math.random() * display.height}});
            }
        }
        ctx.fillStyle = "#777";
        ctx.fillRect(0, 0, display.width, display.height);
        ctx.fillStyle = "black";
        for (let ellipse of sandbox_ellipses) {
            ellipse.position.x += led_force_x(ellipse.position.x) + 2 * Math.random() - 1;
            ellipse.position.y += led_force_y(ellipse.position.y) + 2 * Math.random() - 1;
            ellipse.rotation += .1 * (2 * Math.random() - 1);
            ctx.beginPath();
            ctx.ellipse(ellipse.position.x, ellipse.position.y, 20, 5, ellipse.rotation, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        drawFromCode();
    }
    else {
      drawFromCode();
    }
    function led_force_x(x) {
      // todo: take into account distance from left and right leds.
      return (app.mainView.ledsSetObj.rightValue || 0 - app.mainView.ledsSetObj.leftValue || 0) / 999 * 2;
    }
    function led_force_y(y) {
        // todo: take into account distance from left and right leds.
        return (app.mainView.ledsSetObj.topValue || 0 - app.mainView.ledsSetObj.bottomValue || 0) / 999 * 2;
    }

  var img = new Image();
  img.onload = imageOnLoad;
  img.src = app.mainView.bpuAddress + "/?action=snapshot&n=" + (++app.mainView.imageNr);
  img.crossOrigin = "Anonymous";
  //img.src = 'http://171.65.103.23:20030/?action=snapshot&n=' + (++app.mainView.imageNr);
  //img.crossOrigin="Anonymous"

  if (app.mainView.sandboxMode && app.mainView.sandboxVideo && app.mainView.sandboxVideoHasRecorded && !app.mainView.sandboxVideoIsRecording) {
    var displayedFrame = app.mainView.sandboxVideoPlaybackFrame % parseInt(Math.floor(app.mainView.sandboxFrame/50.0)) + 1;
    //console.log(displayedFrame + '---' + app.mainView.sandboxFrame);
    img.src = "/media/videos/" + app.mainView.userName + "-frame-" + app.mainView.sandboxVideoName + "-" + displayedFrame + ".jpg";
    app.mainView.sandboxVideoPlaybackFrame++;
    if (app.mainView.sandboxVideoPlaybackFrame >= app.mainView.sandboxFrame) {
      app.mainView.sandboxVideoPlaybackFrame = 1;
    }
  }
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
    app.mainView.imageNrBack= res.imageNr;
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

