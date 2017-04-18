//***************************
//***BPU Component Control***
//***Author:Tahrina Ahmed**** 
//***************************

//Modules
var rpi =require("wiring-pi");
//Variables
var _valveState='valveClosed';
var _isInitialized=false;


//Init
var _init=function(options, callback) {
    var board = {};
    rpi.setup('sys');


    rpi.wiringPiSPISetup(0,10000000);
    var rst_buf = new Buffer ([0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00,0x13,0x00]);
    rpi.wiringPiSPIDataRW(0,rst_buf);

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
//**********************
//***Valve*** 
//**********************
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

var x=0;
setInterval(function(){
x=x+10;
if(x>100) x = 0;
board.ledsSet(x,100-x,x,100-x);
},1000);

};
exports.init=_init;
exports.getIsInitialized=function() {return _isInitialized;};

_init({}, function(){});
