// Global handle to module
// Declared in other file
// var ImageProcModule = null;

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
var CV;

var canvas={};

function pageDidLoad() {

}

function openCVLoaded() {
  updateStatus("Loading");
  updateStatus("Loaded");
  //listener.addEventListener("message", handleMessage, true );
  //if ( ImageProcModule == null ) {
  //  updateStatus( 'LOADING...' );
  //} else {
  //  updateStatus();
  //}
  CV = new cv();

  canvas.processed = $("#processed")[0];
  canvas.processed.context = canvas.processed.getContext("2d");
  canvas.display = $("#display")[0];
  canvas.display.context = canvas.display.getContext("2d");
  processNextImage();
}

function processNextImage(timestamp)
{
  //console.log(timestamp);
  imageOnLoad = function()
  {
    canvas.display.context.drawImage(this, 0, 0);
    // imData = getDataFromImage(this);
    imData = CV.imread(canvas.display);
    //console.log(imData)
    var cmd = { cmd: "process",
                width: canvas.display.width,
                height: canvas.display.height,
                data: imData,
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
                drawCircleData: app.mainView.drawCircleData,
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
    processAndDrawImage(cmd);

    requestAnimationFrame(processNextImage);
    /*requestAnimationFrame() {

    }*/
    //ImageProcModule.postMessage( cmd );
  }

  window.img = new Image();
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

function processAndDrawImage(cmd) {
  
  let mat = cmd.data;

  for (let cmdName in cmd) {
    if (cmdName != "drawCircleData") continue;
    for (let cmdFunctions of cmd[cmdName]) {
      cmdFunctions(CV);
    }
  }
  CV.imshow(canvas.processed, mat);
  mat.delete();

  //canvas.processed.context.strokeRect(20,20,150,100);
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

