(function () {
	'use strict';

	angular
		.module('BioLab.components')
		.factory('joystickAPI', joystickAPI)
		.directive('joystick', joystick);

	function joystickAPI() {
		return {};
	}

	function joystick($parse, $document, $timeout, $compile) {
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


					// Defining elements

				var button = angular.element(element[0].querySelector('.joystick'));
				var pad    = element[0].querySelector('.joystick-pad');

				// Settings

				var settings = {
					elementOffset:   [element[0].offsetLeft, element[0].offsetTop],
					elementPosition: element[0].getBoundingClientRect(),

					center: [button[0].offsetLeft, button[0].offsetTop],
					moving: 0,

					touchedCenter: [],

					debug: function () {
						return scope.debug;
					},

					radius:            0,
					timeoutToStop:     100,
					singleButton:      false
				};

				scope.debug = settings.debug();

				scope.actual = {
					x:         0,
					y:         0,
					magnitude: 0, // 0-100 (percent)
					angle:     0  // in degrees
				};

				/** Movement / UI / Positioning **/

				// $timeout(function () {
				// 	settings.center = [button[0].offsetLeft, button[0].offsetTop];
				//
				// 	button.css({'left': settings.center[0] + 'px'});
				// 	button.css({'top': settings.center[1] + 'px'});
				// }, 500);

				// //// Hooking Up Events

				var stopMovement = 0;

				// //Touch
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
				// 	returnJoystick(button);
				// 	angular.element(window).off('touchmove', touchMove);
				// });
				//
				//


				//Mouse
				var mouseMove = function (event) {
					moveJoystick(event.clientX, event.clientY);
				};

				// button.on('mousedown', function mousedown(event) {
				angular.element(window).on('mousedown', function mousedown(event) {
					if(event.target.className=='joystick-button') {
						console.log('mousedown', event);
						settings.moving = 1;
						$timeout.cancel(stopMovement);

						//Calculate the center of touch from the moment the user clicks on the button
						settings.touchedCenter = [event.clientX, event.clientY];
						angular.element(window).on('mousemove', mouseMove);
					}
				});

				//button.on('mouseup', function mouseup(event){
				angular.element(window).on('mouseup', function mouseup(event) {
					console.log('mouseup', event);

					stopMovement = $timeout(function () {
						settings.moving = 0;
					}, settings.timeoutToStop);

					returnJoystick(button);

					angular.element(window).off('mousemove', mouseMove);
				});

				//
				// // Watching joystick actions
				//
				// // Animation Frame is a much more smoother experience
				// function step(timestamp) {
				// 	if (settings.moving) {
				// 		scope.actual.x = button[0].offsetLeft;
				// 		scope.actual.y = button[0].offsetTop;
				// 		calculateDirectionAndSpeed(scope.actual.x, scope.actual.y);
				// 	}
				// 	if (settings.singleButton) {
				// 		//TODO: As long as the button is pressed, run this function
				// 		calculateSingleMovement(settings.singleButton, timestamp);
				// 	}
				// 	window.requestAnimationFrame(step);
				// }
				//
				// window.requestAnimationFrame(step);
				//
				//
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
					var center        = settings.center[0];
					var circle_cenx   = center;
					var circle_ceny   = center;
					var circle_radius = center - 20;
					settings.radius   = circle_radius;

					var moveX = x - settings.touchedCenter[0];
					var moveY = y - settings.touchedCenter[1];

					var result = limit(
						settings.center[0] + moveX,
						settings.center[1] + moveY,
						circle_cenx,
						circle_ceny,
						circle_radius
					);

					button.css({'left': result.x + 'px'}).css({'top': result.y + 'px'});
					scope.$apply();
				};

				// Return the joystick to its default position
				var returnJoystick = function returnJoystick(button) {
					// If no other action has been taken, return the joystick to its initial position
					button.addClass('returning');

					$timeout(function () {
						button.css({'left': settings.center[0] + 'px', 'top': settings.center[1] + 'px'});
					}, settings.timeoutToStop - 500);

					$timeout(function () {
						button.removeClass('returning');
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
				// 	    if (settings.center[0] > 100) {
				// 		    divider = 1000;
				// 	    }
				//
				// 	    var centerX = settings.center[0];
				// 	    var centerY = settings.center[1];
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
				// 	/*console.log('Sent Params', 'x', pos[0], 'y', pos[1], 'maxAxis', settings.radius || (settings.center[0] - 20), 'minAxis', - (settings.radius || (settings.center[0] -20)), 'maxSpeed', settings.maxPositiveSpeed, 1);
				// 	console.info('artDifferentialControl', artDifferentialControl.calculate(pos[0], pos[1], settings.radius || (settings.center[0] -20), - (settings.radius || (settings.center[0] - 20)), settings.maxPositiveSpeed, 1));*/
				// };
			}
		};
	}


})();
