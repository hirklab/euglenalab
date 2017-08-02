(function () {
	'use strict';

	angular
		.module('BioLab.components')
		.directive('joystick', joystick);

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

			link: function (scope, element, attrs) {
				scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
				scope.debug    = angular.isDefined(scope.debug) ? scope.debug : false;

				var joystickElement = angular.element(element[0]);
				var joystickBounds  = angular.element(element[0].querySelector('.joystick-bounds'));
				var button          = angular.element(element[0].querySelector('.joystick-button-container'));
				var pad             = element[0].querySelector('.joystick-pad');

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
					moving: false,

					touchedCenter: [],

					timeoutToStop: 100,
					singleButton:  false
				};

				scope.actual = {
					x:         0, // 0-1 (normal)
					y:         0, // 0-1 (normal)
					magnitude: 0, // 0-100 (percent)
					angle:     0  // in degrees
				};

				var resize = function () {
					joystickBounds.css({
						'width':  joystickElement.width() + 'px',
						'height': joystickElement.width() + 'px'
					});

					button.css({
						'left':'50%',
						'top': '50%'
					});

					// update all variable properties which can get affected by resize
					settings.elementOffset   = [element[0].offsetLeft, element[0].offsetTop];
					settings.elementPosition = element[0].getBoundingClientRect();

					settings.padCenter = {
						x: joystickElement.offset().left + (joystickElement.width() / 2),
						y: joystickElement.offset().top + (joystickElement.height() / 2)
					};

					settings.padRadius = button[0].offsetLeft;
					settings.padWidth  = 20;
					settings.center    = [button[0].offsetLeft, button[0].offsetTop];

					//relative position with respect to pad
					settings.buttonCenter = [button[0].offsetLeft, button[0].offsetTop];
				};

				resize();

				angular.element($window).bind('resize', function () {
					resize();

					scope.$digest();
				});

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
					if (!scope.disabled) {
						moveJoystick(event.clientX, event.clientY);
					}
				};

				angular.element(window).on('mousedown', function mousedown(event) {
					if (event.target.className.indexOf('joystick-button') >= 0 && event.button == 0 && !scope.disabled) {
						settings.moving = true;
						// $timeout.cancel(stopMovement);

						//Calculate the center of touch from the moment the user clicks on the button
						settings.touchedCenter = [event.clientX, event.clientY];

						angular.element(window).on('mousemove', mouseMove);
					}
				});

				angular.element(window).on('mouseup', function mouseup(event) {
					if (settings.moving) {
						stopMovement = $timeout(function () {
							settings.moving = false;
						}, settings.timeoutToStop);

						repositionJoystick(button);

						angular.element(window).off('mousemove', mouseMove);
					}
				});


				function step(timestamp) {
					if (settings.moving) {
						calculate();
					}
					window.requestAnimationFrame(step);
				}

				window.requestAnimationFrame(step);

				var calculate = function () {
					var x   = (button[0].offsetLeft - settings.buttonCenter[0]) / (settings.padRadius - settings.padWidth);
					var y   = -(button[0].offsetTop - settings.buttonCenter[1]) / (settings.padRadius - settings.padWidth);
					var mag = distance([x, y], [0, 0]) * 100;
					if (mag > 100) mag = 100;

					var rad = Math.atan2(y, x);
					var deg = rad * (180 / Math.PI);

					if (deg < 0) {
						deg = 360 + deg;
					}

					scope.actual.x         = +(x.toFixed(2));
					scope.actual.y         = +(y.toFixed(2));
					scope.actual.magnitude = +(mag.toFixed(2));
					scope.actual.angle     = +(deg.toFixed(2));

					scope.onMove({event: scope.actual});
				};

				var limit = function limit(x, y, centreX, centreY, r) {
					var dist = distance([x, y], [centreX, centreY]);

					if (dist <= r) {
						return {
							x: x,
							y: y
						};
					} else {
						x           = x - centreX;
						y           = y - centreY;
						var radians = Math.atan2(y, x);
						return {
							x: Math.cos(radians) * r + centreX,
							y: Math.sin(radians) * r + centreY
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
					var center         = settings.buttonCenter[0];
					var circle_centreX = center;
					var circle_centreY = center;
					var circle_radius  = center - settings.padWidth;
					settings.radius    = circle_radius;

					var moveX = x - settings.touchedCenter[0];
					var moveY = y - settings.touchedCenter[1];

					var result = limit(
						settings.buttonCenter[0] + moveX,
						settings.buttonCenter[1] + moveY,
						circle_centreX,
						circle_centreY,
						circle_radius
					);

					positionJoystick(result.x, result.y);
					scope.$apply();
				};

				var positionJoystick = function (x, y) {
					button.css({'position': 'absolute', 'left': x + 'px', 'top': y + 'px'});
				};

				var repositionJoystick = function repositionJoystick(button) {
					// If no other action has been taken, return the joystick to its initial position
					button.addClass('returning');

					$timeout(function () {
						positionJoystick(settings.buttonCenter[0], settings.buttonCenter[1]);

						settings.moving = false;
					}, settings.timeoutToStop - 10);

					$timeout(function () {
						button.removeClass('returning');
						calculate();
					}, settings.timeoutToStop);
				};
			}
		};
	}


})();
