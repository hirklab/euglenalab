function MyKeyboardInput(container) 
{
    var scope = this;
    container.onkeydown = function(e) {
	if(e.keyCode==37 || e.keyCode==38 || e.keyCode==39 || e.keyCode==40 ) {
		e.preventDefault(); e.stopPropagation;
	}
	scope.addKey(e);
    };
    container.onkeyup = function(e) {scope.removeKey(e);};
};

MyKeyboardInput.prototype = {

    constructor: Object,
    keyValue: function(value) {
        if(typeof value == "number") {
            return this[code];
        } else if(typeof value == "string") {
            code = this.stringToCode(value);
		if(this[code] == true) {return this[code];}
		else {return false;}		
      	}
    },
    addKey: function(e) {this[e.keyCode] = true;},  
    removeKey: function(e) { this[e.keyCode] = false;},
    stringToCode: function(value) {
        switch(value) {
        case "backspace": return 8;
        case "tab": return 9;
        case "enter": return 13;
        case "shift": return 16;
        case "ctrl": return 17;
        case "alt": return 18;
        case "pause": return 19;
        case "capslock": return 20;
        case "escape": return 27;
        case "pageup": return 33;
        case "pagedown": return 34;
        case "end": return 35;
        case "home": return 36;
        case "leftarrow": return 37;
        case "uparrow": return 38;
        case "rightarrow": return 39;
        case "downarrow": return 40;
        case "insert": return 45;
        case "delete": return 46;
        case "0": return 48;
        case "1": return 49;
        case "2": return 50;
        case "3": return 51;
        case "4": return 52;
        case "5": return 53;
        case "6": return 54;
        case "7": return 55;
        case "8": return 56;
        case "9": return 57;
        case "a": return 65;
        case "b": return 66;
        case "c": return 67;
        case "d": return 68;
        case "e": return 69;
        case "f": return 70;
        case "g": return 71;
        case "h": return 72;
        case "i": return 73;
        case "j": return 74;
        case "k": return 75;
        case "l": return 76;
        case "m": return 77;
        case "n": return 78;

        case "o": return 79;
        case "p": return 80;
        case "q": return 81;
        case "r": return 82;
        case "s": return 83;
        case "t": return 84;
        case "u": return 85;
        case "v": return 86;
        case "w": return 87;
        case "x": return 88;
        case "y": return 89;
        case "z": return 90;
        case "leftwindowkey": return 91;
        case "rightwindowkey": return 92;
        case "selectkey": return 93;
        case "numpad0": return 96;
        case "numpad1": return 97;
        case "numpad2": return 98;
        case "numpad3": return 99;
        case "numpad4": return 100;
        case "numpad5": return 101;
        case "numpad6": return 102;
        case "numpad7": return 103;
        case "numpad8": return 104;
        case "numpad9": return 105;
        case "multiply": return 106;
        case "add": return 107;
        case "subtract": return 109;
        case "decimalpoint": return 110;
        case "divide": return 111;
        case "f1": return 112;
        case "f2": return 113;
        case "f3": return 114;
        case "f4": return 115;
        case "f5": return 116;
        case "f6": return 117;
        case "f7": return 118;
        case "f8": return 119;
        case "f9": return 120;
        case "f10": return 121;
        case "f11": return 122;
        case "f12": return 123;
        case "numlock": return 144;
        case "scrolllock": return 145;
        case "semi-colon": return 186;
        case "equalsign": return 187;
        case "comma": return 188;
        case "dash": return 189;
        case "period": return 190;
        case "forwardslash": return 191;
        case "graveaccent": return 192;
        case "openbracket": return 219;
        case "backslash": return 220;
        case "closebraket": return 221;
        case "singlequote": return 222;
        }
    }
};
