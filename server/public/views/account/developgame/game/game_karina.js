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

console.log("Starting browser detection!!!");

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
  // alert("DEMO GAME ACTIVATED!!!");
  // if (app.mainView.gameDemoMode) {
  //   app.mainView.gameDemoMode = false;
  // } else {
  //   app.mainView.gameDemoMode = true;
  // }
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
      img.src = "http://171.65.103.23:20035/?action=snapshot" + (++imageNr);
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
  console.log("Page is loading...")
  //getVideoSources();
  ImageProcModule = document.getElementById( "image_proc" );
  var listener = document.getElementById("listener");
  updateStatus("Loading");
  listener.addEventListener("message", handleMessage, true );
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
                gameEndMsg: "Game Over",
                gameInSession: true,
                gameDemoMode: false,
                gameDrawOnTrackedEuglena: true,
                // drawRect
                drawRectUpperLeftX: 100, 
                drawRectUpperLeftY: 100, 
                drawRectLowerRightX: 300, 
                drawRectLowerRightY: 300, 
                drawRectR: 100, 
                drawRectG: 100, 
                drawRectB: 100,
                // drawText
                drawTextdrawTxt: "Karina",
                drawTextXPos: 200,
                drawTextYPos: 200,
                drawTextSize: 0.6,
                drawTextR: 100,
                drawTextG: 100,
                drawTextB: 100,
                // getEuglenaInRect
                getEuglenaInRectUpperLeftX: 100,
                getEuglenaInRectUpperLeftY: 100,
                getEuglenaInRectLowerRightX: 300,
                getEuglenaInRectLowerRightY: 300,
                processor: "Euglena" };

    startTime = performance.now();
    ImageProcModule.postMessage( cmd );
  }

  var img = new Image();
  img.onload = imageOnLoad;
  img.src = "http://171.65.103.23:20035/?action=snapshot" + (++imageNr);
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
    // app.mainView.gameEuglenaCount = parseInt(res.TotalEuglena);
    // app.mainView.gameEuglenaInRectCount = parseInt(res.EuglenaInRect);
    // app.mainView.getAllEuglenaPositionsStr = res.EuglenaPositionsStr;
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

