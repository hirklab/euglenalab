//Modules
var rpi =require("wiring-pi");
//Variables
var _valveState='valveClosed';
var _isInitialized=false;

//Init
var _init=function(options, callback) {

    // Fill out all the initialization code
      // TODO
    ///////////////////////////////////////


    // All the directional LEDs (not the backlight but those 4 LEDs around the chip) should be off
    board.ledsOff=function() {
      //TODO
    };

    // All the 4 LEDs shoud be turn on to 100%
    board.ledsOn=function() {
      //TODO
    };


    // Set value = (0,100%) on the LED pin number (number them in whatever way you want)
    board.ledSet=function(pin, value) {
      //TODO
    };

    // Remeber all the values are from 0-100 (i.e. in percentage).
    // Set all the 4 LED in one shot.
    board.ledsSet=function(topValue, rightValue, bottomValue, leftValue) {
      //TODO
    };

    // Toggle Valve, if On, turn it Off, else turn it On.
    board.valveToggle=function() {
      //TODO
    };

    // Open the Valve
    board.valveOpen=function() {
      //TODO
    };

    // Close Valve
    board.valveClose=function() {
      //TODO
    };

    board.valveState=function() {
      return _valveState;
    };

    // ADD all the other extra functions you have
    //TODO
    /////////////

    _isInitialized=true;
    callback(null,[]);
    exports.board=board;
};
exports.init=_init;
exports.getIsInitialized=function() {return _isInitialized;};
