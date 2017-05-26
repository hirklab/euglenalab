//Modules
var rpi = require("wiring-pi");

//Variables
var _valveState = 'valveClosed';
var _isInitialized = false;

//Init
var _init = function (options, callback) {
    var board = {};
    rpi.setup('sys');

    //Create Software pwms:
    Object.keys(options.LedPins).forEach(function (item) {
        rpi.pinMode(options.LedPins[item], rpi.OUTPUT);
        rpi.softPwmCreate(options.LedPins[item], 0, 100);
        rpi.softPwmWrite(options.LedPins[item], 0);
    });

    //Diffuser
    rpi.pinMode(options.diffuserPin, rpi.OUTPUT);
    rpi.digitalWrite(options.diffuserPin, 1);

    //LEDs
    board.ledsOff = function () {
        Object.keys(options.LedPins).forEach(function (item) {
            board.ledSet(options.LedPins[item], 0);
        });
    };

    board.ledsOn = function () {
        Object.keys(options.LedPins).forEach(function (item) {
            board.ledSet(options.LedPins[item], 100);
        });
    };

    board.ledSet = function (pin, value) {
        if (typeof pin != 'number' && options.LedPins[pin]) {
            pin = options.LedPins[pin];
        }
        if (pin && value) {
            console.log('led = {' + pin + ', ' + value + '}');
            rpi.softPwmWrite(pin, value);
        }
    };

    board.ledsSet = function (topValue, rightValue, bottomValue, leftValue) {
        board.ledSet(options.LedPins.Top, topValue);
        board.ledSet(options.LedPins.Right, rightValue);
        board.ledSet(options.LedPins.Bottom, bottomValue);
        board.ledSet(options.LedPins.Left, leftValue);
    };

    board.diffuserSet = function (diffuserValue) {
        // console.log('diffuserSet = ' + diffuserValue);

    };

    board.backlightSet = function (backlightValue) {
        // console.log('backlightSet = ' + backlightValue);
    };

    board.culturelightSet = function (culturelightValue) {
        // console.log('culturelightSet = ' + culturelightValue);

    };

    board.ambientlightSet = function (ambientlightValue) {
        // console.log('ambientlightSet = ' + ambientlightValue);
    };

    board.projectorSet = function (projector, x, y) {
        if (x && y) {
            console.log('projector = {' + x + ', ' + y + '}');

            if (x >= 0 && y >= 0) {
                projector.write("{x: " + x + ", y: " + y + "}\n");
            }

        }
    };

    //Valve
    board.valveToggle = function () {
        if (_valveState == 'valveClosed') {
            board.valveOpen();
            return _valveState;
        } else {
            board.valveClose();
            return _valveState;
        }
    };

    board.valveOpen = function () {
        rpi.pinMode(options.ValvePin, rpi.OUTPUT);
        rpi.digitalWrite(options.ValvePin, 1);
        _valveState = 'valveOpen';
    };

    board.valveClose = function () {
        rpi.pinMode(options.ValvePin, rpi.OUTPUT);
        rpi.digitalWrite(options.ValvePin, 0);
        _valveState = 'valveClosed';
    };

    board.valveState = function () {
        return _valveState;
    };

    _isInitialized = true;
    callback(null, []);
    exports.board = board;
};

exports.init = _init;

exports.getIsInitialized = function () {
    return _isInitialized;
};