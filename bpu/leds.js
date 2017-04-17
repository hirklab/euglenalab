//Modules
var rpi =require("wiring-pi");
//Variables
var _valveState='valveClosed';
var _isInitialized=false;

//Init
var _init=function(options, callback) {
    var board = {};
    rpi.setup('sys');

    //Create Software pwms:
    Object.keys(options.LedPins).forEach(function(item){
        rpi.pinMode(options.LedPins[item], rpi.OUTPUT);
        rpi.softPwmCreate(options.LedPins[item],0,100);
        rpi.softPwmWrite(options.LedPins[item],0);
    });

	//Diffuser
//    rpi.pinMode(options.diffuserPin, rpi.OUTPUT);
//    rpi.digitalWrite(options.diffuserPin, 1);
//    console.log(options.diffuserPin);

    //rpi.softPwmCreate(options.diffuserPin,0, 100);
    //rpi.softPwmWrite(options.diffuserPin, options.diffuserValue);

    //LEDs
//    board.ledsOff=function() {
//      Object.keys(options.LedPins).forEach(function(item) {
//        board.ledSet(options.LedPins[item], 0);
//      });
//    };

//    board.ledsOn=function() {
//      Object.keys(options.LedPins).forEach(function(item) {
//        board.ledSet(options.LedPins[item], 100);
//      });
//    };
//    board.ledSet=function(pin, value) {
//      if(typeof pin!='number' && options.LedPins[pin]) {pin=options.LedPins[pin];}
//      rpi.softPwmWrite(pin,  value);
//    };

//   board.ledsSet=function(topValue, rightValue, bottomValue, leftValue) {
//     board.ledSet(options.LedPins.Top, topValue);
//     board.ledSet(options.LedPins.Right, rightValue);
//      board.ledSet(options.LedPins.Bottom, bottomValue);
//      board.ledSet(options.LedPins.Left, leftValue);
//    };

//**********************
//***Light Control*** 
//**********************
	//var rpi =require("wiring-pi");
	rpi.wiringPiSPISetup(0,10000000);
	var rst_buf = new Buffer ([0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00]);
	rpi.wiringPiSPIDataRW(0,rst_buf);

	//var board = {};

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
//*****************************************************
//*** READ Channel 0 LOW and HIGH bytes ***
//*****************************************************

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xE (DATA1LOW)
var fd = rpi.wiringPiI2CSetup(0x39); 
result = rpi.wiringPiI2CWrite(fd,0x8C);
if(result == -1) {console.log (Error);}

result = rpi.wiringPiI2CRead(fd);
if(result == -1) {console.log (Error);}
else {var ch1=result;}

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xF (DATA1HIGH) 
result = rpi.wiringPiI2CWrite(fd,0x8D);
if(result == -1) {console.log(Error);}

result = rpi.wiringPiI2CRead(fd);
if(result == -1) {console.log(Error);}
else {ch1 = 256*result + ch1; console.log(ch1);}

//*****************************************************
//*** READ Channel 1 LOW and HIGH bytes ***
//*****************************************************

//Command register: cmd=1 clear=0 word=0 block=0 addr=0xE (DATA1LOW)
//var fd = rpi.wiringPiI2CSetup(0x39); 
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
	

//**************************************	
//Valve
//**************************************
	board.valveToggle=function() {
      if(_valveState=='valveClosed') {board.valveOpen(); return _valveState;
      } else {board.valveClose(); return _valveState;}
    };
    board.valveOpen=function() {
      rpi.pinMode(options.ValvePin, rpi.OUTPUT);
      rpi.digitalWrite(options.ValvePin, 1);
      _valveState='valveOpen';
    };
    board.valveClose=function() {
      rpi.pinMode(options.ValvePin, rpi.OUTPUT);
      rpi.digitalWrite(options.ValvePin, 0);
      _valveState='valveClosed';
    };
    board.valveState=function() {
      return _valveState;
    };
    _isInitialized=true;
    callback(null,[]);
    exports.board=board;
};
exports.init=_init;
exports.getIsInitialized=function() {return _isInitialized;};

