(function () {
	'use strict';

	angular.module('BioLab.pages.dashboard')
		.controller('DashboardPageCtrl', DashboardPageCtrl);

	/** @ngInject */
	function DashboardPageCtrl($scope, $rootScope, $http, $q, $state, $log, $timeout,
	                           lodash, uiTourService, toastr,
	                           Microscope, Experiment, socket) {

		var vm          = this;
		vm.connected    = false;
		vm.max          = 5;
		vm.isDisabled   = false;
		vm.isSubmitting = false;
		vm.file         = null;
		vm.noFile       = true;

		vm.experiment = {
			type:           'live',
			tag:            '',
			description:    '',
			duration:       0, // seconds
			proposedEvents: []
		};

		var unhook     = null;
		var thresholds = Microscope.thresholds;

		// todo push it to constants
		var MESSAGES = {
			CONNECTED:         'connected',
			STATUS:            'status',
			UPDATE:            'update',
			CONFIRMATION:      'confirmation',
			LIVE:              'live',
			EXPERIMENT_SET:    'experimentSet',
			EXPERIMENT_CANCEL: 'experimentCancel',
			STIMULUS:          'stimulus',
			MAINTENANCE:       'maintenance',
			DISCONNECTED:      'disconnected'
		};

		var findClass = function (statType, value) {
			if (statType !== null || statType !== '') {
				var threshold = thresholds[statType];

				return threshold.find(function (thresh) {
					return thresh.min <= value;
				})['value'];
			}
			return '';
		};

		vm.initialize = function () {
			// attach a demo tour
			uiTourService.createDetachedTour('demo');

			// get machine ip and location - demographics
			$http.get('http://ipinfo.io/json').success(function (data) {
				vm.experiment.machine = data;
			});

			// get list of microscopes
			Microscope.list().then(function (res) {
				vm.activeMicroscopes = lodash.chain(res.data.results)
					.filter(function (microscope) {
						return microscope.name !== 'fake' && microscope.isOn;
					})
					.sortBy('index')
					.map(function (microscope) {
						microscope.panelClass = 'microscope bootstrap-panel';

						microscope.panelClass += microscope.isOn ? ' enabled' : ' disabled';

						if (microscope.isOn) {
							microscope.address = 'http://' + microscope.publicAddr.ip + ':' + microscope.publicAddr.webcamPort + '?action=snapshot';
						} else {
							microscope.address = '/assets/img/bpu-disabled.jpg'
						}

						microscope.statistics = microscope.stats.map(function (stat) {
							var newValue = {
								'name':  stat.statType,
								'value': stat.data.inverseTimeWeightedAvg,
								'max':   stat.statType === 'response' ? 4 * (4 / microscope.magnification) : stat.statType === 'population' ? 300 / (microscope.magnification) : 500
							};

							newValue['percent'] = newValue['value'] * 100 / newValue['max'];
							newValue['class']   = findClass(stat.statType, newValue['percent']);

							return newValue;
						});

						if (microscope.statistics.length === 0) {
							microscope.statistics = [{}, {}, {}];
							microscope.quality    = 0;
						} else {
							var response = lodash.find(microscope.statistics, function (stat) {
								return stat.name === 'response';
							});

							var activity = lodash.find(microscope.statistics, function (stat) {
								return stat.name === 'activity';
							});

							var population = lodash.find(microscope.statistics, function (stat) {
								return stat.name === 'population';
							});

							microscope.quality = (5 * response['percent'] / 100 + 2 * activity['percent'] / 100 + 3 * population['percent'] / 100) / 10;
						}

						microscope.status = "offline"; // Microscope.BPU_STATUS_DISPLAY[microscope.bpuStatus];
						microscope.queueTime = 0;
						microscope.isConnected = false;

						return microscope;
					})
					.value();

				// todo
				// handle actions when no bpu available

				// connect to webserver and keep updating microscopes' status
				unhook = $rootScope.$on("message", onMessage.bind(vm));

				// remove listener when view goes out of context
				$scope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
					if (fromState.name === 'dashboard') {
						$scope.$on('$destroy', unhook);

					}
				});
			});


		};

		vm.initialize();

		vm.showDemo = function () {
			uiTourService.getTourByName('demo').start();
		};

		var onMessage = function (e, message) {
			var that = this;

			if (message) {
				var type    = message.type;
				var payload = message.payload;
				//
				// $log.log('[RX] ' + type);
				// if (payload) $log.log(payload);

				switch (type) {
					case MESSAGES.STATUS:
						onStatus(payload);
						break;

					case MESSAGES.CONFIRMATION:
						onGetConfirmation(payload);
						break;

					case MESSAGES.LIVE:
						onLiveExperiment(payload);
						break;

					default:
						$log.error('invalid message: message type not handled');
						break;
				}
			}
		};

		var onGetConfirmation = function (payload) {
			var confirmationTimeout = 10; // seconds

			timedCall(
				confirmationTimeout,
				function (resolve, reject) {
					if (confirm('Go to live lab. Please confirm in ' + confirmationTimeout + 'seconds.')) {
						// todo update socket that user confirmed


						resolve();
					} else {
						reject('canceled');
					}
				}
			);
		};

		var onLiveExperiment = function (payload) {
			$state.go('livelab'); // shift to livelab page
		};

		// syncing live
		var onStatus = function (payload) {
			var bpuUpdates = angular.copy(payload.microscopes);
			var users      = angular.copy(payload.users);

			$scope.$apply(function () {
				vm.users = users;

				lodash.map(vm.activeMicroscopes, function (microscope) {

					var bpu = lodash.find(bpuUpdates, function (bpu) {
						return bpu.name === microscope.name;
					});

					if (bpu != null) {
						microscope.status = bpu.status;
						microscope.isConnected = bpu.isConnected;
						microscope.queueTime = bpu.queueTime || 0;

						// microscope.allowedGroups               = bpu.allowedGroups;
						// microscope.processingTimePerExperiment = bpu.bpu_processingTime;
						// microscope.timePending                 = (bpu.timePending > 0 ? bpu.timePending : 0);

						// todo show time left
						// show running experiment
						// user involved
					}
				});
			});
		};

		// vm.ms2min = function (ms) {
		// 	return Math.floor(ms / 60000);
		// };

		var ms2s = function (ms) {
			return Math.round(ms / 1000);
		};

		vm.start = function () {
			var errors = false;

			return $q(function (resolve, reject) {
				if (!vm.isSubmitting) {
					vm.isSubmitting = true;

					if (vm.validate()) {
						vm.experiment.submittedAt = new Date();

						//todo remove any non-essential info from microscope object in experiment


						// make a rest call to server
						Experiment.create(vm.experiment)
							.then(function (response, status) {
								resolve();
							}, function (error, status) {
								toastr.error(error.message, 'Experiment submission failed!');
								reject(error.message);
							});

						vm.isSubmitting = false;

					} else {
						toastr.error("Please check if experiment has correct data to execute.", 'Invalid experiment!');
						vm.isSubmitting = false;
						reject();
					}
				} else {
					vm.isSubmitting = false;
					reject();
				}
			});
		};

		vm.selectMode = function (mode) {
			vm.experiment.type = mode;
		};

		vm.toggleSelection = function (microscope) {
			if (vm.selected && vm.selected.name == microscope.name) {
				vm.selected             = null;
				vm.experiment.chosenBPU = null;
				vm.experiment.selection = 'auto';
			} else {
				vm.selected             = microscope;
				vm.experiment.chosenBPU = microscope;
				vm.experiment.selection = 'user';
			}
		};

		vm.upload = function (file) {
			if (window.FileReader) {

				if (file && typeof(file)) {
					// toastr.info('Uploading file...');

					var fileReader      = new FileReader();
					fileReader.filename = file.name;
					fileReader.type     = file.type;
					fileReader.size     = (file.size / 1024).toFixed(2);  // in kb
					fileReader.readAsText(file);
					fileReader.onload = loadHandler;
				}
				// else {
				// 	toastr.error('Only CSV (.csv) files are supported.', 'Error');
				// }

			} else {
				toastr.error('FileReader is not supported in this browser.', 'Error');
			}
		};

		function loadHandler(event) {
			// Papa library in global context
			var csv = event.target.result;

			var file = Papa.parse(csv, {
				skipEmptyLines: true,
				header:         true,
				dynamicTyping:  true,
				comments:       true,
				complete:       function (results) {
					vm.file = {
						data:     results.data,
						filename: event.target.filename,
						type:     event.target.type,
						size:     event.target.size
					};

					toastr.success('File loaded successfully');

					var events = lodash.sortBy(vm.file.data, 'time');

					if (events.length > 0) {
						var duration = ms2s(parseInt(events[events.length - 1].time, 10)); // 1 sec

						if (duration <= 1) {
							// min duration allowed
							toastr.error('Experiment is too short to be executed', 'Invalid experiment');
						} else if (duration > 60 * 60) { // 1 hr
							// max duration allowed
							toastr.error('Experiment is too long to be executed', 'Invalid experiment');
						} else {
							// parse file and massage data type
							var proposedEvents = lodash.map(events, function (event) {
								return lodash.mapValues(event, function (o) {
									return parseFloat(o);
								});
							});

							vm.experiment.duration       = duration;
							vm.experiment.proposedEvents = proposedEvents;
							vm.experiment.tag            = vm.file.filename;
						}
					} else {
						// invalid time values
						toastr.error('Experiment has no events to execute', 'Invalid experiment');
					}
				},
				error:          function (err, file) {
					toastr.error('Please check the file format.' + err, 'File parsing failed!');
				}
			});
		}

		vm.validate = function () {
			var result = false;

			if (vm.experiment.type.indexOf('live') > -1) {
				// checks for live
				result = true;
			} else {
				// checks for batch
				result = vm.experiment.proposedEvents.length > 0 && vm.experiment.duration > 1 && vm.experiment.duration < 60 * 60;
			}

			// similiar checks are also done on server side

			return result;
		};

		var timedCall = function (timeout, callback) {
			return $q(function (resolve, reject) {
				callback(resolve, reject);

				$timeout(function () {
					reject('timeout');
				}, timeout);
			});
		};
	}

})();