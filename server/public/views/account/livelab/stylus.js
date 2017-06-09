var Stylus = function(canvasDiv) {
    var me = this;

    //Class Variables
    // me.snapBack = true;
    me.className = 'canvas-stylus';

    //Touch Events
    me.canvasDiv = canvasDiv;

    //Create Canvas
    var canvasPCT = 1.0;
    me.canvas = document.createElement('canvas');
    me.canvas.id = 'Stylus';
    me.canvas.width = canvasDiv.clientWidth * canvasPCT;
    me.canvas.height = canvasDiv.clientWidth * canvasPCT;
    me.canvas.className = me.className + '-' + 'off';
    me.canvas.visible = true;
    // me.canvas.style.left = canvasDiv.clientWidth * ((1 - canvasPCT) * 0.5) + 'px';
    // me.canvas.style.top = canvasDiv.clientHeight * ((1 - canvasPCT) * 0.5) + 'px';
    me.canvas.style.position = 'relative';
    canvasDiv.appendChild(me.canvas);

    //Set Context
    var context = me.canvas.getContext('2d');
    context.strokeStyle = "#ff00ff";
    context.lineWidth = 2;

    //OriginalValues
    me.orig = {};
    me.orig.textStimulus = {
        x: 8,
        y: 20,
        size: '16'
    };
    // me.orig.textAngle = {
    //   x: 8,
    //   y: 20,
    //   size: '16'
    // };
    me.titlePos = {
        x: 0,
        y: 0
    };

    //Static Joystick Parameters
    me.RADS_TO_DEGREES = 180 / Math.PI;
    me.TWO_PI = 2 * Math.PI;
    me.segs = 48;
    me.arcLength = (me.TWO_PI) / me.segs;
    me.textStimulus = JSON.parse(JSON.stringify(me.orig.textStimulus));
    // me.textAngle = JSON.parse(JSON.stringify(me.org.textAngle));

    me.x = 0;
    me.y = 0;
    me.mag = 100;

    //Resize Joystick Parameters
    me.centerPoint = {
        x: me.canvas.width * 0.500,
        y: me.canvas.height * 0.500
    };

    me.maxradius = 1;
    // me.joyHeadRadius = me.maxJoyRadius * 0.200;

    //Dynamic Joystick Parameters
    me.stimulus_evt = {
        x: 0,
        y: 0,
        mag: 0
    };
    me.x_evt = me.centerPoint.x;
    me.y_evt = me.centerPoint.y;

    //Draw Updates

    this.updateDraw = function(text) {

        //Clear Draw Context
        if (text && text.hasOwnProperty('projectorClear') && text.projectorClear > 0) {
            context.beginPath();
            context.clearRect(0, 0, me.canvas.width, me.canvas.height);
        }

        // console.log(me.canvas.visible);
        // me.canvas.style.visibility = (me.canvas.visible ? 'visible' : 'hidden');
        me.canvas.style.opacity = (me.canvas.visible ? 1 : 0);

        //Resize Joystick Parameters
        //me.maxJoyRadius=me.canvas.width*0.300;
        //if(me.canvas.height<me.canvas.width) {me.maxJoyRadius=me.canvas.height*0.300;}
        //me.joyHeadRadius=me.maxJoyRadius*0.200;
        //me.centerPoint={x:me.canvas.width*0.500, y:me.canvas.height*0.550};
        //me.textIntensity={x:10, y:44};
        //me.textAngle={x:0, y:20};

        //Draw Sequence

        //Static
        // drawBoundingCircle();
        // drawBoundingCircleHalf();

        //Dynamic - Fillstyle(opacity) Depends on intensity of joystick
        // drawIntensityCircle(me.inten_evt);

        //Static
        // drawCenterMark();

        //Dynamic -
        if (me.x_evt && me.y_evt) {
            drawPoint(me.x_evt, me.y_evt);
            // drawStimulusText(me.stimulus_evt, me.x_evt, me.y_evt);
            // drawCenterMark();
        }
        // drawJoystickHead(me.x_evt, me.y_evt);

        //Text


    };

    //Draw Functions
    //Dynamic
    // var drawIntensityCircle = function(alpha) { //alpha: Depends on intensity of joystick
    //   context.beginPath();
    //   context.fillStyle = "rgba(255, 255, 0, " + alpha + ")";
    //   context.arc(me.centerPoint.x, me.centerPoint.y, me.maxJoyRadius * 0.95, 0, me.TWO_PI, true);
    //   context.fill();
    // };

    // var drawJoystickStick = function(xPos, yPos) { //xPos, yPos: joystick x, y coordinantes
    //   context.beginPath();
    //   context.strokeStyle = "rgba(255, 255, 255, " + '0.666' + ")";
    //   context.lineWidth = 2;
    //   context.moveTo(me.centerPoint.x, me.centerPoint.y);
    //   context.lineTo(xPos, yPos);
    //   context.stroke();
    // };

    var drawPoint = function(xPos, yPos) {
        context.beginPath();
        context.fillStyle = "rgba(53, 103, 191, 1)";
        context.arc(xPos, yPos, me.maxradius, 0, me.TWO_PI, true);
        context.fill();
    };

    // //Static
    var drawCenterMark = function() {
        context.beginPath();
        context.strokeStyle = "rgba(255, 255, 255, 1)";
        context.lineWidth = 2;
        context.moveTo(me.centerPoint.x, me.centerPoint.y - 4);
        context.lineTo(me.centerPoint.x, me.centerPoint.y + 4);
        context.moveTo(me.centerPoint.x - 4, me.centerPoint.y);
        context.lineTo(me.centerPoint.x + 4, me.centerPoint.y);
        context.stroke();
    };



    // var drawBoundingCircle = function() {
    //   for (var i = 0; i < me.segs; i = i + 2) {
    //     context.beginPath();
    //     context.strokeStyle = "rgba(255, 255, 255, 0.5)";
    //     context.lineWidth = 2;
    //     context.arc(me.centerPoint.x, me.centerPoint.y, me.maxJoyRadius, i * me.arcLength + me.arcLength, i * me.arcLength, true);
    //     context.stroke();
    //   }
    // };
    // var drawBoundingCircleHalf = function() {
    //   var arcLengthHalf = me.arcLength * 0.500;
    //   for (var i = 0; i < me.segs * 2; i = i + 2) {
    //     context.beginPath();
    //     context.strokeStyle = "rgba(255, 255, 255, 0.5)";
    //     context.lineWidth = 2;
    //     context.arc(me.centerPoint.x, me.centerPoint.y, me.maxJoyRadius * 0.500, i * arcLengthHalf + arcLengthHalf, i * arcLengthHalf, true);
    //     context.stroke();
    //   }
    // };
    //Text
    var drawStimulusText = function(stimulus, x, y) {
        context.beginPath();
        context.fillStyle = "rgba(255, 255, 255, 1.0)";
        context.font = me.textStimulus.size + 'px Arial';
        // var txt = Math.round(alpha * 100) / 100 + '';
        // if (txt.length === 1) {
        //   txt += '.00';
        // } else if (txt.length === 3) {
        //   txt += '0';
        // }
        // context.fillText('{x=' + Math.round(x) + ',y=' + Math.round(y) + ',mag=' + Math.round(stimulus.mag) + '}', me.textStimulus.x, me.textStimulus.y);
    };

    // var drawAngleText = function(angle) {
    //   context.beginPath();
    //   context.fillStyle = "rgba(255, 255, 255, " + 1.0 + ")";
    //   context.font = me.textAngle.size + 'px Arial';
    //   var num = Number(angle);
    //   if (num <= 0) {
    //     num = Math.abs(num);
    //   } else {
    //     num = 360 - num;
    //   }
    //   var txt = Math.round(num * 100) / 100 + '';
    //   if (txt.length === 1) {
    //     txt = '  ' + txt;
    //   } else if (txt.length === 2) {
    //     txt = ' ' + txt;
    //   }
    //   context.fillText('Angle: ' + txt + '°', me.textAngle.x, me.textAngle.y);
    // };

    var drawTitle = function() {
        context.beginPath();
        context.fillStyle = "rgba(255, 255, 255, " + 1.0 + ")";
        context.font = me.textStimulus.size + 'px Arial';
        var title = 'Stylus';
        var m = context.measureText(title);
        context.fillText(title, me.canvas.width - m.width - 5, me.canvas.height - 5);
    };

    return this;
};

Stylus.prototype = Object.create(Object.prototype);

Stylus.prototype.reset = function(index) {
    // this.setPositionFromLightValues(lightValues);
    this.drawTitle();
};

Stylus.prototype.toggleVisiblity = function() {

    this.canvas.visible = !this.canvas.visible;
    console.log(this.canvas.visible);
}

Stylus.prototype.resize = function(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;

    //Resize Joystick Parameters
    // this.maxJoyRadius = this.canvas.width * 0.300;
    // if (this.canvas.height < this.canvas.width) {
    //   this.maxJoyRadius = this.canvas.height * 0.300;
    // }
    // this.joyHeadRadius = this.maxJoyRadius * 0.200;
    this.centerPoint = {
        x: this.canvas.width * 0.500,
        y: this.canvas.height * 0.550
    };

    if (this.canvas.width < 200) {
        // this.textAngle.size = '' + (this.canvas.width * 12 / 200);
        // this.textAngle.x = 4;
        // this.textAngle.y = 10;

        this.textStimulus.size = '' + (this.canvas.width * 12 / 200);
        this.textStimulus.x = 4;
        this.textStimulus.y = 25;

    } else {

        this.textStimulus.size = this.orig.textStimulus.size;
        this.textStimulus.x = this.orig.textStimulus.x;
        this.textStimulus.y = this.orig.textStimulus.y;

        // this.textAngle.size = this.org.textAngle.size;
        // this.textAngle.x = this.org.textAngle.x;
        // this.textAngle.y = this.org.textAngle.y;
    }

    this.titlePos.x = (3 * this.canvas.width) / 4;
    this.titlePos.y = (this.canvas.height - 20);
};

Stylus.prototype.toggle = function(toggle) {
    if (this.canvas.className !== this.className + '-' + toggle) {
        this.canvas.className = this.className + '-' + toggle;
    }
};

Stylus.prototype.update = function(text) {
    this.updateDraw(text);
};

Stylus.prototype.getXY = function(values, from) {
    var x = values.offsetX;
    var y = values.offsetY;
    var color = values.color;
    var clear = values.clear;

    return {
        x: x == null ? -1 : Math.round(x),
        y: y == null ? -1 : Math.round(y),
        color: color == null ? -1 : Math.round(color),
        clear: clear == null ? -1 : Math.round(clear)
    };
};

Stylus.prototype.setXY = function(projectorSetObj, from) {
    //Convert Event Vector to Joystick Center
    this.dx_evt = projectorSetObj.metaData.offsetX; // - this.centerPoint.x;
    this.dy_evt = projectorSetObj.metaData.offsetY; // - this.centerPoint.y;
    this.dcolor_evt = projectorSetObj.metaData.color; // - this.centerPoint.y;
    this.dclear_evt = projectorSetObj.metaData.clear; // - this.centerPoint.y;

    //Check parameters outside joystick radius
    //  scale down to max
    if (this.stimulus_evt.mag > 100) {
        this.stimulus_evt.mag = 100;
    }

    //Joystick head point
    this.x_evt = this.dx_evt;
    this.y_evt = this.dy_evt;

    projectorSetObj.projectorX = (this.dx_evt == null ? -1 : this.dx_evt);
    projectorSetObj.projectorY = (this.dy_evt == null ? -1 : this.dy_evt);
    projectorSetObj.projectorColor = (this.dcolor_evt == null ? -1 : this.dcolor_evt);
    projectorSetObj.projectorClear = (this.dclear_evt == null ? -1 : this.dclear_evt);

    //Add info to ledsSetObj
    projectorSetObj.metaData.mag = this.stimulus_evt;
    // ledsSetObj.metaData.degs = this.degs_evt;
    // ledsSetObj.metaData.rads = this.rads_evt;
    // projectorSetObj.metaData.x = this.x_evt;
    // projectorSetObj.metaData.y = this.y_evt;
    // projectorSetObj.metaData.color = this.dcolor_evt;
    // projectorSetObj.metaData.clear = this.dclear_evt;

    return projectorSetObj;
};