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

var canvas={"processed": {}, "display": {"context": {}}};

let asmWorker = new Worker('/views/account/developgame/game/ImageProcAsm/asm-worker.js');

function pageDidLoad() {
  canvas.processed = $("#processed")[0];
  canvas.processed.context = canvas.processed.getContext("2d");
  canvas.display = $("#display")[0];
  canvas.display.context = canvas.display.getContext("2d");
  console.log("pg loaded");
  updateStatus("Loading");
  updateStatus("Loaded");


  processNextImage();
}



function processNextImage(timestamp)
{
  function imageOnLoad()
  {
    // canvas.display.context.drawImage(this, 0, 0);
    imData = getDataFromImage(this);
    
    // imData = CV.imread(canvas.display);
    
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
                drawLineData: app.mainView.drawLineData,
                // drawRect
                drawRectData: app.mainView.drawRectData,
                // drawText
                drawTextData: app.mainView.drawTextData,
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
    // console.log("cmd is ", cmd.drawCircleData, imData);
    asmWorker.postMessage(cmd);

    
  }

  window.img = new Image();
  img.onload = imageOnLoad;
  //var img = {};
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
   var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open('GET',img.src,true);

    // Must include this line - specifies the response type we want
    xmlHTTP.responseType = 'arraybuffer';

    xmlHTTP.onload = function(e)
    {
        if (xmlHTTP.readyState != 4) return;
      

        var arr = new Uint8Array(this.response);
        //console.log(arr);
        //var image = new ImageData(arr, canvas.processed.width, canvas.processed.height);
        //imshow(canvas.processed, image);
        imageOnLoad(arr);
        return;

        // Convert the int array to a binary string
        // We have to use apply() as we are converting an *array*
        // and String.fromCharCode() takes one or more single values, not
        // an array.
        var raw = String.fromCharCode.apply(null,arr);

        // This works!!!
        var b64=btoa(raw);
        var dataURL="data:image/jpeg;base64,"+b64;
        document.getElementById("image").src = dataURL;
    };

    //xmlHTTP.send();
}

asmWorker.onmessage= function(e) {
  //if (!e || e.type != "update") return;
  if (e.data.imgData) {
    //e.data.imgData = canvas.display
    
    drawImageOnCanvas(e.data.imgData);
    requestAnimationFrame(processNextImage);
    //setTimeout(processNextImage, 500);
  }
  else {
  console.log('no', e.data);
}

};

/*function imshow(canvas, imgData) {
  console.log("im show");
  var ctx = canvas.context || canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  imgData = canvas.display.context.getImageData(0,0,100,100);
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  ctx.putImageData(imgData, 0, 0);
}*/

function getDataFromImage( img ) {
  // Get image data from specified canvas
  canvas.display.context.drawImage(img,0,0)
  var height = canvas.display.height;
  var width = canvas.display.width;
  var nBytes = height * width * 4;
  var pixels = canvas.display.context.getImageData(0, 0, width, height);
  var imData = { width: width, height: height, data: pixels.data.buffer };
  return pixels;
}


function drawImageOnCanvas(pixels){
    canvas.processed.context.putImageData( pixels, 0, 0 );
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

