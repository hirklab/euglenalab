/* global app:true */
(function () {
    'use strict';
    app = app || {};
    $(document).ready(function () {
        app.mainView = new app.MainView();
    });
    app.User = Backbone.Model.extend({
        idAttribute: '_id',
        url: '/account/livelab/',
    });
    app.Session = Backbone.Model.extend({
        idAttribute: '_id',
        url: '/account/livelab/'
    });

    app.Survey = Backbone.Model.extend({
        idAttribute: '_id',
        url: '/account/survey/'
    });

    app.SurveyView = Backbone.View.extend({
        el: '.modal',
        template: _.template($('#tmpl-survey').html()),
        events: {
            'click #btn-submit': 'update',
            'click #btn-close': 'hide',
        },
        isOpen: false,
        initialize: function (options, callback) {
            this.model = new app.Survey(options.survey || {});
            this.model.set('experiment', options.id);
            this.callback = callback;
            this.render();
        },
        show: function () {
            this.isOpen = true;
            this.$el.modal('show');
        },
        hide: function () {
            this.isOpen = false;
            this.$el.data('modal', null);
            this.$el.modal('hide');
        },
        close: function () {
            this.callback();

            this.unbind();
            this.$el.remove();
        },
        update: function () {
            this.model.save({
                rating: this.$el.find('[name="rating"]').val(),
                notes: this.$el.find('[name="notes"]').val(),
            });

            this.$el.modal('hide');
        },
        render: function () {
            this.$el.html(this.template(this.model));

            this.$el.on('hidden.bs.modal', _.bind(function () {
                this.close();
            }, this));

            for (var key in this.model) {
                if (this.model.hasOwnProperty(key)) {
                    this.$el.find('[name="' + key + '"]').val(this.model[key]);
                }
            }

            $('input.rating').rating({
                filled: 'fa fa-star',
                filledSelected: 'fa fa-star',
                empty: 'fa fa-star-o'
            });

            this.$el.modal({
                show: false,
                keyboard: false
            }); // dont show modal on instantiation
        },
    })

    app.MainView = Backbone.View.extend({
        el: '.page .container',
        events: {},
        hadJoyActivity: false,
        roughLabStartDate: null,
        isSocketInitialized: false,
        ledsSetObj: null,

        timeForLab: 0,
        timeInLab: 0,
        timeLeftInLab: 0,
        wasTimeSetFromUpdate: false,

        updateLoopInterval: null,

        //Tag-Initialize
        initialize: function () {
            //Get Window Stats
            window.dispatchEvent(new Event('resize'));

            app.mainView = this;

            app.mainView.user = new app.User(JSON.parse(unescape($('#data-user').html())));
            app.mainView.session = new app.Session(JSON.parse(unescape($('#data-session').html())));
            app.mainView.bpu = new app.User(JSON.parse(unescape($('#data-bpu').html())));
            app.mainView.ledsSetObj = new app.User(JSON.parse(unescape($('#data-setLedsObj').html())));
            app.mainView.bpuExp = new app.User(JSON.parse(unescape($('#data-bpuExp').html())));
            app.mainView.bpuExp.attributes.exp_eventsToRun.sort(function (objA, objB) {
                return objB.time - objA.time;
            });

            //Set Lab Times
            app.mainView.timeForLab = app.mainView.bpuExp.attributes.exp_eventsToRun[0].time;
            app.mainView.setTimeLeftInLabLabel(app.mainView.timeForLab, 0, true);

            app.userSocketClient.setConnection(function (err, setLedsObj) {
                if (err) {
                    app.mainView.isSocketInitialized = false;
                    app.mainView.kickUser(err, 'initialize setConnection');
                } else {

                    //My Objects
                    app.mainView.myLightsObj.build(function (err, dat) {
                        app.mainView.myJoyStickObj.build(function (err, dat) {
                            app.mainView.isSocketInitialized = true;
                            if (app.mainView.myJoyStickObj.doesExist) {
                                app.mainView.myJoyStick.toggleJoystick('on');
                                app.mainView.setupMouseEvents(function (err, dat) {
                                    app.mainView.setupKeyboardEvents(function (err, dat) {
                                        app.mainView.startUpdateLoop();
                                    });
                                });
                            } else {
                                app.mainView.setupKeyboardEvents(function (err, dat) {
                                    app.mainView.startUpdateLoop();
                                });
                            }
                        });
                    });
                }
            });
        },
        alreadyKicked: false,
        kickUser: function (err, from) {
            console.log('kicked from ' + from);
            // console.log('kick user loop');

            if (err) console.log('kickUser', err, from);

            $('.video')[0].src = $('.video')[0].src.replace('stream', 'snapshot');

            if (!app.mainView.alreadyKicked) {
                app.mainView.alreadyKicked = true;
            }

            if (app.mainView.updateLoopInterval) {
                clearInterval(app.mainView.updateLoopInterval);
                app.mainView.updateLoopInterval = null;
            }

            if (app.mainView.keyboardTimeout) {
                clearTimeout(app.mainView.keyboardTimeout);
                app.mainView.keyboardTimeout = null;
            }

            if (app.mainView.bpuExp != null) {
                app.mainView.showSurvey();
            } else {
                location.href = '/account/';
            }
        },
        showSurvey: function () {
            // console.log('show survey loop');

            app.surveyView = new app.SurveyView(app.mainView.bpuExp, function () {
                console.log('survey submitted');
                location.href = '/account/';
            });
            app.surveyView.show();

        },
        getLedsSetObj: function () {
            if (app.mainView.ledsSetObj === null) {
                return null;
            } else {
                return JSON.parse(JSON.stringify(app.mainView.ledsSetObj));
            }
        },
        setLedsFromLightValues: function (lightValues, evtType, previousTouchState) {
            var point = app.mainView.myJoyStick.getXyFromLightValues(lightValues, previousTouchState + '->setLedsFromLightValues');

            var ledsSetObj = app.mainView.getLedsSetObj();
            ledsSetObj.metaData.clientTime = new Date().getTime();

            ledsSetObj.metaData.layerX = point.x;
            ledsSetObj.metaData.layerY = point.y;
            ledsSetObj.metaData.offsetX = point.x;
            ledsSetObj.metaData.offsetY = point.y;
            ledsSetObj.metaData.evtType = evtType;
            ledsSetObj.metaData.touchState = app.mainView.myJoyStickObj.touchState;
            ledsSetObj.metaData.previousTouchState = previousTouchState;

            ledsSetObj.metaData.radius = 0;
            ledsSetObj.metaData.angle = 0;

            ledsSetObj.topValue = 0;
            ledsSetObj.rightValue = 0;
            ledsSetObj.bottomValue = 0;
            ledsSetObj.leftValue = 0;

            app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, previousTouchState + '->setLedsFromLightValues');
        },
        lastSetLedsFromEventDate: new Date().getTime(),
        setLedsFromEventInterval: 30,
        setLedsFromEvent: function (evt, evtType, previousTouchState) {
            // console.log('Layer = {' + evt.layerX + ',' + evt.layerY + '}');
            // console.log('Offset = {' + evt.offsetX + ',' + evt.offsetY + '}');
            // console.log('Screen = {' + evt.screenX + ',' + evt.screenY + '}');

            var ledsSetObj = app.mainView.getLedsSetObj();
            ledsSetObj.metaData.clientTime = new Date().getTime();

            ledsSetObj.metaData.layerX = evt.layerX;
            ledsSetObj.metaData.layerY = evt.layerY;
            ledsSetObj.metaData.offsetX = evt.offsetX;
            ledsSetObj.metaData.offsetY = evt.offsetY;
            ledsSetObj.metaData.clientX = evt.clientX;
            ledsSetObj.metaData.clientY = evt.clientY;
            ledsSetObj.metaData.className = evt.target.className;

            ledsSetObj.metaData.evtType = evtType;
            ledsSetObj.metaData.touchState = app.mainView.myJoyStickObj.touchState;
            ledsSetObj.metaData.previousTouchState = previousTouchState;

            app.mainView.setLedsFromObjectAndSendToServer(ledsSetObj, previousTouchState + '->setLedsFromEvent');
        },
        setLedsFromObjectAndSendToServer: function (ledsSetObj, from) {

            //Rest Values
            ledsSetObj.metaData.radius = 0;
            ledsSetObj.metaData.angle = 0;

            ledsSetObj.topValue = 0;
            ledsSetObj.rightValue = 0;
            ledsSetObj.bottomValue = 0;
            ledsSetObj.leftValue = 0;
            ledsSetObj = app.mainView.myJoyStick.setLightValuesFromXY(ledsSetObj, from + '->setLedsFromObjectAndSendToServer');
            app.mainView.myLightsObj.update(ledsSetObj);

            //only update bpu on interval
            var newDate = new Date();
            if ((newDate - app.mainView.lastSetLedsFromEventDate) >= app.mainView.setLedsFromEventInterval) {
                app.mainView.lastSetLedsFromEventDate = newDate;
                app.userSocketClient.ledsSet(ledsSetObj);
            }
        },

        //From Socket
        setTimeLeftInLabLabel: function (timeLeft, dt, isReal) {
            if (isReal) {
                app.mainView.timeLeftInLab = timeLeft;
            } else {
                app.mainView.timeLeftInLab -= dt;
            }

            app.mainView.timeInLab += dt;

            var titleMsg = app.mainView.bpu.get('name') + '';
            var timeMsg = '';

            if (app.mainView.timeLeftInLab > 0) {
                if (app.mainView.timeLeftInLab === null) {
                    timeMsg += '...';
                } else {
                    var timeLeftSec = Math.round(app.mainView.timeLeftInLab / 1000);
                    if (app.mainView.wasTimeSetFromUpdate) {
                        timeMsg += timeLeftSec + 's';
                    } else {
                        timeMsg += '~' + timeLeftSec + 's';
                    }
                }
            } else {
                if (isReal || app.mainView.wasTimeSetFromUpdate) {
                    timeMsg += 'Time over';
                    // setTimeout(function() {
                    //   clearInterval(app.mainView.updateLoopInterval);
                    //   app.mainView.updateLoopInterval = null;

                    //   clearTimeout(app.mainView.keyboardTimeout);
                    //   app.mainView.keyboardTimeout = null;
                    // }, 1);
                } else if (app.mainView.wasTimeSetFromUpdate) {
                    timeMsg += '0' + ' s';
                } else {
                    timeMsg += '~0' + ' s';
                }
            }

            var label = app.mainView.$el.find('[name="' + 'microscopeName' + '"]')[0];
            if (label) label.innerHTML = titleMsg;

            label = app.mainView.$el.find('[name="' + 'timeLeftInLab' + '"]')[0];
            if (label) label.innerHTML = timeMsg + (timeMsg.indexOf('s') > -1 ? ' remaining' : '');
        },

        //Tag-UpdateLoop
        startUpdateLoop: function () {
            var frameTime = new Date().getTime();
            var lastFrameTime = frameTime;
            var deltaFrame = frameTime - lastFrameTime;
            var timerActivatedJoystick = 0;
            //Update Loop
            app.mainView.updateLoopInterval = setInterval(function () {
                frameTime = new Date().getTime();
                deltaFrame = frameTime - lastFrameTime;
                lastFrameTime = frameTime;
                timerActivatedJoystick += deltaFrame;
                //Set time left in lab
                app.mainView.setTimeLeftInLabLabel(null, deltaFrame, false);

                // console.log("timeInLab:" + app.mainView.timeInLab)
                // console.log("timeForLab:" + app.mainView.timeForLab)

                //Fail safe user kick. leds will not be set on bpu if bpu is done.
                //  this covers the case if the server does not properly inform the client of a lab over scenerio.
                if (app.mainView.timeLeftInLab < 0) {
                    console.log('experiment over , kick user now');
                    app.mainView.kickUser(null, 'complete');

                    clearInterval(app.mainView.updateLoopInterval);
                    app.mainView.updateLoopInterval = null;

                    clearTimeout(app.mainView.keyboardTimeout);
                    app.mainView.keyboardTimeout = null;
                } else {
                    if (app.mainView.isSocketInitialized && !app.mainView.hadJoyActivity) {
                        if (timerActivatedJoystick > 1000) {
                            timerActivatedJoystick = 0;
                            if (app.mainView.myJoyStick.canvas.className === 'canvas-joystick-off') {
                                app.mainView.myJoyStick.toggleJoystick('on');
                            } else {
                                app.mainView.myJoyStick.toggleJoystick('off');
                            }
                        }
                    } else {
                        timerActivatedJoystick = 0;
                    }
                }
                app.mainView.myJoyStick.update('Joystick');
            }, 20);
        },
        //Tag-Joystick
        myJoyStick: null,
        myJoyStickObj: {
            touchState: 'up',
            doesExist: false,
            build: function (cb_fn) {
                if (app.mainView.$el.find('[name="' + 'myJoystick' + '"]')[0]) {
                    app.mainView.myJoyStickObj.doesExist = true;
                    app.mainView.myJoyStick = new Canvas_Joystick(app.mainView.$el.find('[name="' + 'myJoystick' + '"]')[0]);
                }
                cb_fn(null, null);
            },
        },
        //Tag-Lights
        myLights: null,
        myLightsObj: {
            doesExist: false,
            build: function (cb_fn) {
                if (app.mainView.$el.find('[name="' + 'myTopLight' + '"]')[0] && app.mainView.$el.find('[name="' + 'myRightLight' + '"]')[0] &&
                    app.mainView.$el.find('[name="' + 'myBottomLight' + '"]')[0] && app.mainView.$el.find('[name="' + 'myLeftLight' + '"]')[0]) {
                    app.mainView.myLightsObj.doesExist = true;
                    app.mainView.myLights = {};
                    app.mainView.myLights.top = app.mainView.$el.find('[name="' + 'myTopLight' + '"]')[0];
                    app.mainView.myLights.right = app.mainView.$el.find('[name="' + 'myRightLight' + '"]')[0];
                    app.mainView.myLights.bottom = app.mainView.$el.find('[name="' + 'myBottomLight' + '"]')[0];
                    app.mainView.myLights.left = app.mainView.$el.find('[name="' + 'myLeftLight' + '"]')[0];
                    app.mainView.myLights.topValue = app.mainView.$el.find('[name="' + 'myTopLight' + '"]').find('span')[0];
                    app.mainView.myLights.rightValue = app.mainView.$el.find('[name="' + 'myRightLight' + '"]').find('span')[0];
                    app.mainView.myLights.bottomValue = app.mainView.$el.find('[name="' + 'myBottomLight' + '"]').find('span')[0];
                    app.mainView.myLights.leftValue = app.mainView.$el.find('[name="' + 'myLeftLight' + '"]').find('span')[0];
                }
                cb_fn(null, null);
            },
            update: function (data) {
                if (app.mainView.myLightsObj.doesExist) {
                    app.mainView.myLights.top.style.backgroundColor = 'rgba(255,255,0,' + data.topValue / 100 + ')';
                    app.mainView.myLights.right.style.backgroundColor = 'rgba(255,255,0,' + data.rightValue / 100 + ')';
                    app.mainView.myLights.bottom.style.backgroundColor = 'rgba(255,255,0,' + data.bottomValue / 100 + ')';
                    app.mainView.myLights.left.style.backgroundColor = 'rgba(255,255,0,' + data.leftValue / 100 + ')';

                    app.mainView.myLights.topValue.innerHTML = data.topValue;
                    app.mainView.myLights.rightValue.innerHTML = data.rightValue;
                    app.mainView.myLights.bottomValue.innerHTML = data.bottomValue;
                    app.mainView.myLights.leftValue.innerHTML = data.leftValue;
                }
            },
        },
        //Mouse Keyboard Event Controller
        zeroLeds: {
            topValue: 0,
            rightValue: 0,
            bottomValue: 0,
            leftValue: 0
        },
        lastMouseMoveTime: new Date().getTime(),

        //Events Router
        setLedsEventController: function (evt, evtType) {
            var previousTouchState = '' + app.mainView.myJoyStickObj.touchState;
            if (evtType === 'mousedown') {
                app.mainView.hadJoyActivity = true;

                app.mainView.myJoyStick.toggleJoystick('on');
                app.mainView.myJoyStickObj.touchState = 'down';
                //Set Leds
                app.mainView.setLedsFromEvent(evt, evtType, previousTouchState);

            } else if (evtType === 'mousemove') {

                if (app.mainView.myJoyStickObj.touchState === 'down' && new Date().getTime() - app.mainView.lastMouseMoveTime > 20) {
                    app.mainView.lastMouseMoveTime = new Date().getTime();
                    //Set Leds
                    app.mainView.setLedsFromEvent(evt, evtType, previousTouchState);
                }

            } else if (evtType === 'mouseout') {
                app.mainView.myJoyStickObj.touchState = 'up';
                app.mainView.myJoyStick.toggleJoystick('off');
                //Set Leds
                app.mainView.setLedsFromLightValues(app.mainView.zeroLeds, evtType, previousTouchState);

            } else if (evtType === 'mouseup') {
                app.mainView.myJoyStickObj.touchState = 'up';
                app.mainView.myJoyStick.toggleJoystick('off');
                //Set Leds
                app.mainView.setLedsFromLightValues(app.mainView.zeroLeds, evtType, previousTouchState);

            } else if (evtType === 'resize') {
                app.mainView.myJoyStickObj.touchState = 'up';
                app.mainView.myJoyStick.toggleJoystick('off');
                //Set Leds
                app.mainView.setLedsFromLightValues(app.mainView.zeroLeds, evtType, previousTouchState);

            } else if (evtType === 'myJoyKeys_loop') { //event is light values
                app.mainView.myJoyStick.toggleJoystick('on');
                app.mainView.setLedsFromLightValues(evt, evtType, previousTouchState);
            }
        },

        //Tag-Keyboard
        myJoyKeys: null,
        setupKeyboardEvents: function (cb_fn) {
            app.mainView.myJoyKeys = {
                updateTime: 20,
                deltaValue: 2,
                areKeysRunning: false,
                runKeys: function () {
                    var me = app.mainView.myJoyKeys;
                    if (!this.areKeysRunning) {
                        this.areKeysRunning = true;
                        var loop = function () {
                            app.mainView.keyboardTimeout = setTimeout(function () {
                                if (me.keys.space.isDown) {
                                    loop();
                                } else {
                                    //Top
                                    if (me.keys.top.isDown && me.keys.bottom.value === 0) {
                                        if (me.keys.top.value < 100) {
                                            me.keys.top.value += me.deltaValue;
                                        }
                                    } else if (me.keys.top.value > 0) {
                                        me.keys.top.value -= me.deltaValue;
                                    } else {
                                        //Bottom
                                        if (me.keys.bottom.isDown) {
                                            if (me.keys.bottom.value < 100) {
                                                me.keys.bottom.value += me.deltaValue;
                                            }
                                        } else if (me.keys.bottom.value > 0) {
                                            me.keys.bottom.value -= me.deltaValue;
                                        }
                                    }
                                    //Right
                                    if (me.keys.right.isDown && me.keys.left.value === 0) {
                                        if (me.keys.right.value < 100) {
                                            me.keys.right.value += me.deltaValue;
                                        }
                                    } else if (me.keys.right.value > 0) {
                                        me.keys.right.value -= me.deltaValue;
                                    } else {
                                        //Left
                                        if (me.keys.left.isDown) {
                                            if (me.keys.left.value < 100) {
                                                me.keys.left.value += me.deltaValue;
                                            }
                                        } else if (me.keys.left.value > 0) {
                                            me.keys.left.value -= me.deltaValue;
                                        }
                                    }
                                    var lightValues = {};
                                    lightValues.topValue = me.keys.top.value;
                                    lightValues.bottomValue = me.keys.bottom.value;
                                    lightValues.rightValue = me.keys.right.value;
                                    lightValues.leftValue = me.keys.left.value;
                                    if (lightValues.topValue + lightValues.bottomValue + lightValues.rightValue + lightValues.leftValue > 0) {
                                        app.mainView.setLedsEventController(lightValues, 'myJoyKeys_loop', app.mainView.myJoyStickObj.touchState);
                                        loop();
                                    } else {
                                        app.mainView.setLedsEventController(lightValues, 'myJoyKeys_loop', app.mainView.myJoyStickObj.touchState);
                                        app.mainView.setLedsFromLightValues(lightValues);
                                        me.areKeysRunning = false;
                                    }
                                }
                            }, me.updateTime);
                        };

                        if (app.mainView.updateLoopInterval != null) {
                            console.log('keyboard loop');
                            loop();
                        }
                    }
                },
                keys: {
                    top: {
                        pairName: '83',
                        name: 'top',
                        key: 'w',
                        code: 87,
                        isMaster: true,
                        isDown: false,
                        value: 0
                    },
                    bottom: {
                        pairName: '87',
                        name: 'bottom',
                        key: 's',
                        code: 83,
                        isMaster: false,
                        isDown: false,
                        value: 0
                    },
                    right: {
                        pairName: '65',
                        name: 'right',
                        key: 'd',
                        code: 68,
                        isMaster: true,
                        isDown: false,
                        value: 0
                    },
                    left: {
                        pairName: '68',
                        name: 'left',
                        key: 'a',
                        code: 65,
                        isMaster: false,
                        isDown: false,
                        value: 0
                    },
                    space: {
                        pairName: null,
                        name: 'space',
                        key: 'a',
                        code: 32,
                        isMaster: true,
                        isDown: false,
                        value: 0
                    },
                }
            };
            document.addEventListener('keydown', function (event) {
                if (app.mainView.myJoyStickObj.touchState !== 'down') {
                    Object.keys(app.mainView.myJoyKeys.keys).forEach(function (item) {
                        if (event.keyCode == app.mainView.myJoyKeys.keys[item].code) {
                            app.mainView.myJoyKeys.keys[item].isDown = true;
                            app.mainView.myJoyKeys.runKeys();
                        }
                    });
                }
            });
            document.addEventListener('keyup', function (event) {
                if (app.mainView.myJoyStickObj.touchState !== 'down') {
                    Object.keys(app.mainView.myJoyKeys.keys).forEach(function (item) {
                        if (event.keyCode == app.mainView.myJoyKeys.keys[item].code) {
                            app.mainView.myJoyKeys.keys[item].isDown = false;
                            app.mainView.myJoyKeys.runKeys();
                        }
                    });
                }
            });
            cb_fn(null, null);
        },
        //Tag-Mouse
        setupMouseEvents: function (cb_fn) {
            //Events
            window.addEventListener('resize', function (evt) {
                // console.log(evt);
                //Resize Joystick Canvas
                var joystickContainer = app.mainView.$el.find('#joystick-container')[0];
                var joystickCanvas = app.mainView.$el.find('[name="' + 'myJoystick' + '"]')[0];

                if (joystickContainer && joystickCanvas && app.mainView.myJoyStick) {
                    var element = null;

                    try {
                        element = window.getComputedStyle(joystickContainer, null);
                    } catch (e) {
                        element = joystickContainer.currentStyle.height;
                    }
                    console.log(element);

                    app.mainView.myJoyStick.resize(parseFloat(element.getPropertyValue('width')), parseFloat(element.getPropertyValue('height')));
                }
                app.mainView.setLedsEventController(evt, 'resize');
            });
            document.addEventListener('mousemove', function (evt) {
                if (app.mainView.isSocketInitialized && app.mainView.hadJoyActivity) {
                    if (evt.target.className === 'canvas-joystick-on' || evt.target.className === 'canvas-joystick-off') {
                        app.mainView.setLedsEventController(evt, 'mousemove');
                    }
                }
            }, true);
            document.addEventListener('mousedown', function (evt) {
                if (app.mainView.isSocketInitialized) {
                    if (evt.target.className === 'canvas-joystick-on' || evt.target.className === 'canvas-joystick-off') {
                        app.mainView.setLedsEventController(evt, 'mousedown');
                    }
                }
            }, true);
            document.addEventListener('mouseup', function (evt) {
                if (app.mainView.isSocketInitialized && app.mainView.hadJoyActivity) {
                    app.mainView.setLedsEventController(evt, 'mouseup');
                }
            }, true);
            document.addEventListener('mouseout', function (evt) {
                if (app.mainView.isSocketInitialized && app.mainView.hadJoyActivity) {
                    if (evt.target.className === 'page') {
                        app.mainView.setLedsEventController(evt, 'mouseout');
                    }
                }
            }, true);

            window.dispatchEvent(new Event('resize'));
            cb_fn(null, null);
        },
    });
}());