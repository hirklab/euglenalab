(function () {
	'use strict';

	angular
		.module('BioLab.components')
		.factory('joystickAPI', joystickAPI)
		.directive('joystick', joystick);

	function joystickAPI() {
		return {};
	}

	function joystick($parse, $document, $window, $timeout, $compile) {
		return {
			restrict:    'E',
			scope:       {
				debug:    '=',
				disabled: '=',
				onMove:   '&'
			},
			transclude:  false,
			templateUrl: 'app/components/joystick/joystick.html',

			controller: function ($scope, $timeout, joystickAPI) {
				joystickAPI.goBackToLevel = function (direction) {
					console.log('direction', direction);
				};
			},

			link: function (scope, element, attrs) {
				/**
				 * Angular Joystick - Consensus / Options
				 * - listens for mouse and touch events
				 * - a specific radius cannot be gotten past on the ui interface
				 * - after a set time of inactivity (no touch, mouseup event) retract the joystick
				 * - distance traveled from center to margin
				 * */
				var joystickElement = angular.element(element[0]);
				var joystickBounds  = angular.element(element[0].querySelector('.joystick-bounds'));
				var button          = angular.element(element[0].querySelector('.joystick-button-container'));
				var pad             = element[0].querySelector('.joystick-pad');


				// Settings

				var settings = {
					    elementOffset:   [element[0].offsetLeft, element[0].offsetTop],
					    elementPosition: element[0].getBoundingClientRect(),

					    padCenter: {
						    x: joystickElement.offset().left + (joystickElement.width() / 2),
						    y: joystickElement.offset().top + (joystickElement.height() / 2)
					    },

					    padRadius:      button[0].offsetLeft,
					    padWidth:       20, // 20 px in svg
					    joystickRadius: 60, // 60 px in styles

					    center: [button[0].offsetLeft, button[0].offsetTop],
					    radius: 0,
					    // moving: 0,

					    touchedCenter: [],

					    debug: function () {
						    return scope.debug;
					    },

					    timeoutToStop: 100,
					    singleButton:  false
				    }
				;

				scope.moving = false;

				scope.debug = settings.debug();

				scope.actual = {
					x:         0,
					y:         0,
					magnitude: 0, // 0-100 (percent)
					angle:     0  // in degrees
				};

				/** Movement / UI / Positioning **/
				var resize = function () {
					joystickBounds.css({
						'width':  joystickElement.width() + 'px',
						'height': joystickElement.width() + 'px'
					});

					//relative position with respect to pad
					settings.buttonCenter = [button[0].offsetLeft, button[0].offsetTop];

					settings.padCenter = {
						x: joystickElement.offset().left + (joystickElement.width() / 2),
						y: joystickElement.offset().top + (joystickElement.height() / 2)
					};
				};

				resize();

				angular.element($window).bind('resize', function () {
					resize();

					scope.$digest();
				});

				// Hooking Up Events

				var stopMovement = 0;

				//Touch
				//
				// var touchEventPresent = 0;
				// var touchMove         = function (event) {
				// 	var touch = event[touchEventPresent][0];
				// 	moveJoystick(touch.clientX, touch.clientY);
				// };
				//
				// button.on('touchstart', function touchstart(event) {
				// 	settings.moving = 1;
				// 	$timeout.cancel(stopMovement);
				// 	//console.log('touchstart', event);
				// 	var touch = [];
				// 	if (event.originalEvent) {
				// 		touch             = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
				// 		touchEventPresent = 'originalEvent';
				// 	} else if (event.targetTouches) {
				// 		touch             = event.targetTouches[0];
				// 		touchEventPresent = 'targetTouches';
				// 	} else if (event.changedTouches) {
				// 		touch             = event.changedTouches[0];
				// 		touchEventPresent = 'changedTouches';
				// 	}
				//
				// 	//Calculate the center of touch from the moment the user clicks on the button
				// 	settings.touchedCenter = [touch.clientX, touch.clientY];
				// 	angular.element(window).on('touchmove', touchMove);
				// });
				//
				// angular.element(window).on('touchend', function touchend(event) {
				// 	//console.log('touchend', event);
				// 	stopMovement = $timeout(function () {
				// 		settings.moving = 0;
				// 	}, settings.timeoutToStop);
				//
				// 	repositionJoystick(button);
				// 	angular.element(window).off('touchmove', touchMove);
				// });
				//
				//

				//Mouse
				var mouseMove = function (event) {
					moveJoystick(event.clientX, event.clientY);
				};

				// angular.element(window).on('mousemove', function (event) {
				// 	console.log(event.clientX, event.clientY, settings.padCenter, joystickElement.offset().top, joystickElement.height() / 2);
				// });

				angular.element(window).on('mousedown', function mousedown(event) {
					// console.log('mousedown', event);
					if (event.target.className.indexOf('joystick-button') >= 0 && event.button == 0) {
						scope.moving = true;
						// $timeout.cancel(stopMovement);

						//Calculate the center of touch from the moment the user clicks on the button
						settings.touchedCenter = [event.clientX, event.clientY];
						// positionJoystick(event.clientX, event.clientY);
						angular.element(window).on('mousemove', mouseMove);
					}
				});

				// scope.$watch('moving', function (newVal, oldVal) {
				// 	console.log("moving:" , newVal);
				// 	//
				// 	// if(newVal){
				// 	//
				// 	// }else{
				// 	//
				// 	// }
				// });


				//button.on('mouseup', function mouseup(event){
				angular.element(window).on('mouseup', function mouseup(event) {
					// console.log('mouseup', event);
					if (scope.moving) {
						stopMovement = $timeout(function () {
							scope.moving = false;
						}, settings.timeoutToStop);

						repositionJoystick(button);

						angular.element(window).off('mousemove', mouseMove);
					}
				});


				// Watching joystick actions

				// Animation Frame is a much more smoother experience
				function step(timestamp) {
					if (scope.moving) {
						calculate();
					}
					window.requestAnimationFrame(step);
				}

				window.requestAnimationFrame(step);

				var calculate = function(){
					scope.actual.x = button[0].offsetLeft - settings.buttonCenter[0];
					scope.actual.y = button[0].offsetTop - settings.buttonCenter[1];
					var mag = distance([scope.actual.x, scope.actual.y], [0, 0]) * 100 / (settings.padRadius - settings.padWidth);
					if(mag>100) mag =100;

					scope.actual.magnitude = mag;

					console.log(scope.actual.x, scope.actual.y, scope.actual.magnitude);
				};


				// Moving the joystick & utilities
				var limit = function limit(x, y, cenx, ceny, r) {
					var dist = distance([x, y], [cenx, ceny]);

					if (dist <= r) {
						return {
							x: x,
							y: y
						};
					} else {
						x           = x - cenx;
						y           = y - ceny;
						var radians = Math.atan2(y, x);
						return {
							x: Math.cos(radians) * r + cenx,
							y: Math.sin(radians) * r + ceny
						};
					}
				};

				var distance = function distance(dot1, dot2) {
					var x1 = dot1[0],
					    y1 = dot1[1],
					    x2 = dot2[0],
					    y2 = dot2[1];
					return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
				};

				var moveJoystick = function moveJoystick(x, y) {
					var center        = settings.buttonCenter[0];
					var circle_cenx   = center;
					var circle_ceny   = center;
					var circle_radius = center - settings.padWidth;
					settings.radius   = circle_radius;

					var moveX = x - settings.touchedCenter[0];
					var moveY = y - settings.touchedCenter[1];

					var result = limit(
						settings.buttonCenter[0] + moveX,
						settings.buttonCenter[1] + moveY,
						circle_cenx,
						circle_ceny,
						circle_radius
					);

					positionJoystick(result.x, result.y);
					scope.$apply();
				};

				var positionJoystick = function (x, y) {
					// x = x-(settings.joystickRadius/2);
					// y = y-(settings.joystickRadius/2);
					button.css({'position': 'absolute', 'left': x + 'px', 'top': y + 'px'});
				};

				// return the joystick to its default position
				var repositionJoystick = function repositionJoystick(button) {
					// If no other action has been taken, return the joystick to its initial position
					button.addClass('returning');

					$timeout(function () {
						positionJoystick(settings.buttonCenter[0], settings.buttonCenter[1]);

						scope.moving = false;
					}, settings.timeoutToStop-10);

					$timeout(function () {
						button.removeClass('returning');
						calculate();
					}, settings.timeoutToStop);
				};
				//
				// /** Math for speed / direction **/
				//
				//     //// Utilities
				//
				// var pxToCarthesian = function pxToCarthesian(x, y) {
				//
				// 	    var divider = 100;
				// 	    if (settings.buttonCenter[0] > 100) {
				// 		    divider = 1000;
				// 	    }
				//
				// 	    var centerX = settings.buttonCenter[0];
				// 	    var centerY = settings.buttonCenter[1];
				//
				//
				// 	    // This is not carthesian, at all ... f**k it.
				// 	    //Make all the number in the range of 1 <> -1, otherwise the algorithm returns gibberish ... //TODO: <<<<
				// 	    return [-(x - centerX) / divider, -(y - centerY) / divider];
				//
				//     };
				//
				// // This should run only once
				// var pxToSpeedRatio = function () {
				//
				// 	var pixels = settings.radius;
				//
				// 	if (settings.speedIncrease() === 'linear') {
				//
				// 		var ratio                  = settings.maxPositiveSpeed / pixels;
				// 		settings.pixelToSpeedRatio = ratio;
				// 		return ratio;
				//
				// 	} else {
				//
				// 		//TODO: Make the logic for this
				// 		console.log('Exponential');
				//
				// 	}
				//
				// };
				//
				// var calculateDirectionAndSpeed = function calculateDirectionAndSpeed(x, y) {
				//
				// 	var position   = pxToCarthesian(x, y); // Returns and array [x,y]
				// 	var speedRatio = settings.pixelToSpeedRatio || pxToSpeedRatio();
				//
				// 	if (settings.directionManagement() === 'differential') {
				// 		differentialControl(position, speedRatio);
				// 	}
				// 	//TODO: The other direction management options
				//
				// };
				//
				// // Single Button press movement
				// var initialDelta            = 0;
				// var stopSingleMovement      = 0;
				// var calculateSingleMovement = function calculatSingleMovement(direction, delta) {
				// 	$timeout.cancel(stopSingleMovement);
				//
				// 	if (!initialDelta) {
				// 		initialDelta = delta;
				// 	}
				//
				// 	//TODO: Increase to max speed in 2 seconds
				//
				// 	stopSingleMovement = $timeout(function () {
				// 		//TODO: Decrease to 0 in 2 seconds
				// 	}, 2000);
				//
				//
				// 	console.log(direction);
				// };
				//
				//
				// /** Direction management options **/
				//
				// var differentialControl = function (pos, ratio) {
				//
				// 	/** Adjustments by adaptorel
				// 	 *
				// 	 *  I won't dwell much on this at the moment, I'll need to refine/test the differential calculation algorithm.
				// 	 * */
				//
				// 	var wheels = artDifferentialControl.calculate(pos[0], pos[1], undefined, undefined, settings.maxPositiveSpeed);
				//
				// 	var l = wheels[0];
				// 	if (l > 50) {
				// 		l = 50 + l;
				// 	} else if (l < -50) {
				// 		l = l - 50;
				// 	} else {
				// 		l = 0;
				// 	}
				//
				// 	var r = wheels[1];
				// 	if (r > 50) {
				// 		r = 50 + r;
				// 	} else if (r < -50) {
				// 		r = r - 50;
				// 	} else {
				// 		r = 0;
				// 	}
				//
				// 	// Curve / Corner Case
				//
				// 	// Smoother curves
				// 	/*if (l - r > 200) {
				// 		r += 70
				// 	} else if (l - r < -200) {
				// 		l += 70
				// 	}*/
				//
				// 	scope.actual.finalWheelSpeedLeft  = parseInt(0 - l);
				// 	scope.actual.finalWheelSpeedRight = parseInt(0 - r);
				//
				// 	scope.sendMovement({response: {left: 0 - l, right: 0 - r}});
				// 	/*console.log('Sent Params', 'x', pos[0], 'y', pos[1], 'maxAxis', settings.radius || (settings.buttonCenter[0] - 20), 'minAxis', - (settings.radius || (settings.buttonCenter[0] -20)), 'maxSpeed', settings.maxPositiveSpeed, 1);
				// 	console.info('artDifferentialControl', artDifferentialControl.calculate(pos[0], pos[1], settings.radius || (settings.buttonCenter[0] -20), - (settings.radius || (settings.buttonCenter[0] - 20)), settings.maxPositiveSpeed, 1));*/
				// };
			}
		};
	}


})();
