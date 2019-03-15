//**********************
//***Light Control*** 
//**********************
//Modules

var rpi =require("wiring-pi");
rpi.wiringPiSPISetup(0,10000000);
var rst_buf = new Buffer ([0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00]);
rpi.wiringPiSPIDataRW(0,rst_buf);

var board = {};

//**********************
//***Base LEDs*** 
//**********************
 
    board.ledsSet=function(topValue, rightValue, bottomValue, leftValue) {   
      topValue = Math.round(( topValue / 100.0 ) * 255.0);
      rightValue = Math.round(( rightValue / 100.0 ) * 255.0);
      bottomValue = Math.round(( bottomValue / 100.0 ) * 255.0);
      leftValue = Math.round(( leftValue / 100.0 ) * 255.0);
      var buf = new Buffer ([0x11,leftValue,0x11,bottomValue,0x11,rightValue,0x11,topValue]); 
      rpi.wiringPiSPIDataRW(0,buf);
    };

//**********************
//***Diffuser Light*** 
//********************** 

    board.diffuserSet=function(diffuserValue) { 
      diffuserValue = Math.round(( diffuserValue / 100.0 ) * 255.0);
      var buf = new Buffer ([0x00,0x00,0x00,0x00,0x00,0x00,0x12,diffuserValue]); 
      rpi.wiringPiSPIDataRW(0,buf);
    };

//**********************
//***Back Light*** 
//**********************
  
    board.backlightSet=function(backlightValue) {
      backlightValue = Math.round(( backlightValue / 100.0 ) * 255.0);  
      var buf = new Buffer ([0x00,0x00,0x00,0x00,0x12,backlightValue,0x00,0x00]); 
      rpi.wiringPiSPIDataRW(0,buf);
    };  

//**********************
//***Culture Light*** 
//**********************

    board.culturelightSet=function(culturelightValue) {
      culturelightValue = Math.round(( culturelightValue / 100.0 ) * 255.0);
      var buf = new Buffer ([0x00,0x00,0x12,culturelightValue,0x00,0x00,0x00,0x00]); 
      rpi.wiringPiSPIDataRW(0,buf);
    };

//**********************
//***Ambient Light*** 
//**********************
  
    board.ambientlightSet=function(ambientlightValue) {
      ambientlightValue = Math.round(( ambientlightValue / 100.0 ) * 255.0);
      var buf = new Buffer ([0x12,ambientlightValue,0x00,0x00,0x00,0x00,0x00,0x00]); 
      rpi.wiringPiSPIDataRW(0,buf);
    }; 


board.ledsSet(100,0,0,0);
board.diffuserSet(0);
board.backlightSet(0);
board.culturelightSet(100);
board.ambientlightSet(0);

var board.reliabilityControl = function(desiredDensity,desiredRespTop,desiredRespRight,
                                        desiredRespBottom,desiredRespLeft,errMargin) {
  var currentDensity;
  var currentBacklightVal;
  var newBacklightVal;
  var success = 0;
  for (var i=0; i<10; i++) {
    currentDensity = board.densityGet();
    currentBacklightVal = board.backlightGet();
    if (currentDensity < desiredDensity) {
      var decrement = desiredDensity-currentDensity;
      if (decrement < errMargin) {
        console.log ("Desired reliability reached within margin");
        success=1;
        break;
      }
      console.log ("Observed is less than Desired");
      newBacklightVal = board.getModelBacklightVal(currentDensity,desiredDensity,currentBacklightVal);
    } else if (currentDensity > desiredDensity) {
      var increment = currentDensity-desiredDensity;
      if (increment < errMargin) {
        console.log ("Desired reliability reached within margin");
        success=1;
        break;
      }
      newBacklightVal = getModelBacklightVal(currentDensity,desiredDensity,currentBacklightVal);
      console.log ("Observed is greater than Desired");
    } else {
      console.log ("Desired reliability reached");
      success=1; 
      break;
    }
    //Program new backlightVal
    board.backlightSet(newBacklightVal);
    
    //Wait for 15s
    board.sleep (1500000);
  }

  if (success==0) {
    console.log ("ERROR: SYS ADMIN SUPPORT REQUIRED - Could not achieve convergence in 10 iterations");
  }

  var desiredResp = desiredRespRight;
  var currentResp;
  var currentLedVal;
  var newLedVal;
  var success1 = 0;
  for (var i=0; i<10; i++) {
    currentResp = board.respRightGet();
    currentLedVal = board.ledRightGet();
    if (currentResp < desiredResp) {
      var decrement = desiredResp-currentResp;
      if (decrement < errMargin) {
        console.log ("Desired reliability reached within margin");
        success1=1;
        break;
      }
      console.log ("Observed is less than Desired");
      newLedVal = board.getModelLedVal(currentResp,desiredResp,currentLedVal);
    } else if (currentResp > desiredResp) {
      var increment = currentResp - desiredResp;
      if (increment < errMargin) {
        console.log ("Desired reliability reached within margin");
        success1=1;
        break;
      }
      newLedVal = getModelLedVal(currentResp,desiredResp,currentResp);
      console.log ("Observed is greater than Desired");
    } else {
      console.log ("Desired reliability reached");
      success1=1; 
      break;
    }
    //Program new LedVal
    board.ledRightSet(newLedVal);
    
    //Wait for 15s
    board.sleep (1500000);
  }

  if (success1==0) {
    console.log ("ERROR: SYS ADMIN SUPPORT REQUIRED - Could not achieve convergence in 10 iterations");
  }
  
  var desiredResp = desiredRespLeft;
  var currentResp;
  var currentLedVal;
  var newLedVal;
  var success2 = 0;
  for (var i=0; i<10; i++) {
    currentResp = board.respLeftGet();
    currentLedVal = board.ledLeftGet();
    if (currentResp < desiredResp) {
      var decrement = desiredResp-currentResp;
      if (decrement < errMargin) {
        console.log ("Desired reliability reached within margin");
        success2=1;
        break;
      }
      console.log ("Observed is less than Desired");
      newLedVal = board.getModelLedVal(currentResp,desiredResp,currentLedVal);
    } else if (currentResp > desiredResp) {
      var increment = currentResp - desiredResp;
      if (increment < errMargin) {
        console.log ("Desired reliability reached within margin");
        success2=1;
        break;
      }
      newLedVal = getModelLedVal(currentResp,desiredResp,currentResp);
      console.log ("Observed is greater than Desired");
    } else {
      console.log ("Desired reliability reached");
      success2=1; 
      break;
    }
    //Program new LedVal
    board.ledLeftSet(newLedVal);
    
    //Wait for 15s
    board.sleep (1500000);
  }

  if (success2==0) {
    console.log ("ERROR: SYS ADMIN SUPPORT REQUIRED - Could not achieve convergence in 10 iterations");
  }
  
  var desiredResp = desiredRespTop;
  var currentResp;
  var currentLedVal;
  var newLedVal;
  var success3 = 0;
  for (var i=0; i<10; i++) {
    currentResp = board.respTopGet();
    currentLedVal = board.ledTopGet();
    if (currentResp < desiredResp) {
      var decrement = desiredResp-currentResp;
      if (decrement < errMargin) {
        console.log ("Desired reliability reached within margin");
        success3=1;
        break;
      }
      console.log ("Observed is less than Desired");
      newLedVal = board.getModelLedVal(currentResp,desiredResp,currentLedVal);
    } else if (currentResp > desiredResp) {
      var increment = currentResp - desiredResp;
      if (increment < errMargin) {
        console.log ("Desired reliability reached within margin");
        success3=1;
        break;
      }
      newLedVal = getModelLedVal(currentResp,desiredResp,currentResp);
      console.log ("Observed is greater than Desired");
    } else {
      console.log ("Desired reliability reached");
      success3=1; 
      break;
    }
    //Program new LedVal
    board.ledTopSet(newLedVal);
    
    //Wait for 15s
    board.sleep (1500000);
  }

  if (success3==0) {
    console.log ("ERROR: SYS ADMIN SUPPORT REQUIRED - Could not achieve convergence in 10 iterations");
  }
  
  var desiredResp = desiredRespBottom;
  var currentResp;
  var currentLedVal;
  var newLedVal;
  var success4 = 0;
  for (var i=0; i<10; i++) {
    currentResp = board.respBottomGet();
    currentLedVal = board.ledBottomGet();
    if (currentResp < desiredResp) {
      var decrement = desiredResp-currentResp;
      if (decrement < errMargin) {
        console.log ("Desired reliability reached within margin");
        success4=1;
        break;
      }
      console.log ("Observed is less than Desired");
      newLedVal = board.getModelLedVal(currentResp,desiredResp,currentLedVal);
    } else if (currentResp > desiredResp) {
      var increment = currentResp - desiredResp;
      if (increment < errMargin) {
        console.log ("Desired reliability reached within margin");
        success4=1;
        break;
      }
      newLedVal = getModelLedVal(currentResp,desiredResp,currentResp);
      console.log ("Observed is greater than Desired");
    } else {
      console.log ("Desired reliability reached");
      success4=1; 
      break;
    }
    //Program new LedVal
    board.ledBottomSet(newLedVal);
    
    //Wait for 15s
    board.sleep (1500000);
  }

  if (success4==0) {
    console.log ("ERROR: SYS ADMIN SUPPORT REQUIRED - Could not achieve convergence in 10 iterations");
  } 

  return (success0 && success1 && success2 && success3 && success4);

}


//**********************
//***Light Sensor*** 
//**********************

var rpi = require ('wiring-pi');

var fd = rpi.wiringPiI2CSetup(0x39);
//console.log("fd=%d",fd);

//**********************
//***POWER ON ******
//**********************

//Command register: cmd=1 clear=0 word=0 block=0 addr=0x0 (control)
var result = rpi.wiringPiI2CWrite(fd,0x80);
if (result == -1) {console.log(Error);}

//Control register: Set POWER bits to 0b10 i.e. ON
result = rpi.wiringPiI2CWrite(fd,0x03);
if (result == -1) {console.log(Error);}

//TODO:
//Need to wait for 450ms

//*****************************************************
//*** READ Channel 0 LOW and HIGH bytes ***
//*****************************************************

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xC (DATA0LOW) 
result = rpi.wiringPiI2CWrite(fd,0x8C);
if(result == -1) {console.log (Error);}

result = rpi.wiringPiI2CRead(fd);
if(result == -1) {console.log (Error);}
else {var ch0=result;}

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xD (DATA0HIGH) 
result = rpi.wiringPiI2CWrite(fd,0x8D);
if(result == -1) {console.log(Error);}

result = rpi.wiringPiI2CRead(fd);
if(result == -1) {console.log(Error);}
else {ch0 = 256*result + ch0; console.log(ch0);}
 
//*****************************************************
//*** READ Channel 1 LOW and HIGH bytes ***
//*****************************************************

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xE (DATA1LOW) 
result = rpi.wiringPiI2CWrite(fd,0x8E);
if(result == -1) {console.log (Error);}

result = rpi.wiringPiI2CRead(fd);
if(result == -1) {console.log (Error);}
else {var ch1=result;}

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xF (DATA1HIGH) 
result = rpi.wiringPiI2CWrite(fd,0x8F);
if(result == -1) {console.log(Error);}

result = rpi.wiringPiI2CRead(fd);
if(result == -1) {console.log(Error);}
else {ch1 = 256*result + ch1; console.log(ch1);}