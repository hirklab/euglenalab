(function () {
	'use strict';

	angular.module('BioLab.pages.dashboard')
		.controller('DashboardPageCtrl', DashboardPageCtrl);

	/** @ngInject */
	function DashboardPageCtrl($scope, $rootScope, $http, $q, $timeout, $element, lodash, Microscope, socket, uiTourService) {
		uiTourService.createDetachedTour('demo');
		uiTourService.getTourByName('demo').start();

		//todo
		// handle actions when no bpu available


		var socketStrs = {
			setConnection:           '/#setConnection',
			serverError:             '/#serverError',
			submitExperimentRequest: '/#submitExperimentRequest',
			activateLiveUser:        '/#activateLiveUser',
			sendUserToLiveLab:       '/#sendUserToLiveLab'
		};

		var vm        = this;
		vm.connected  = false;
		vm.max        = 5;
		vm.isDisabled = false;

		vm.isSubmitting = false;

		vm.mode = 'live';

		$http.get('http://ipinfo.io/json').success(function (data) {
			vm.machine = data;
		});

		var unhook = null;

		var thresholds = Microscope.thresholds;

		var findClass = function (statType, value) {
			if (statType !== null || statType !== '') {
				var threshold = thresholds[statType];

				return threshold.find(function (thresh) {
					return thresh.min <= value;
				})['value'];
			}
			return '';
		};

		vm.ordering = function (microscope) {
			return parseFloat(microscope.name.replace(/,(?=\d)/g, "").match(/-?\.?\d.*/g));
		};

		Microscope.list().then(function (res) {
			var microscopes = res.data.results
				.filter(function (microscope) {
					return microscope.name !== 'fake';
				})
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

					return microscope;
				});

			var microscopeByStatus = lodash.groupBy(microscopes, 'isOn');
			vm.activeMicroscopes   = microscopeByStatus[true];

		});

		//Activate Live User/Prompt for Join Confirm
		// socket.on(socketStrs.activateLiveUser, function (sessDoc, confirmTimeout, callbackToServer) {
		// 	var resData = {didConfirm: false};
		// 	_joinLabConfirmAlert(confirmTimeout, function (err, didConfirm) {
		// 		resData.didConfirm = didConfirm;
		// 		resData.err = err;
		// 		if (callbackToServer) callbackToServer(resData);
		// 	});
		// });
		//
		// //Send Live User to lab
		// socket.on(socketStrs.sendUserToLiveLab, function (reqObj, callbackToServer) {
		// 	if (callbackToServer) callbackToServer({err: null});
		// 	console.log("app.gameSession: " + app.gameSession);
		// 	if (app.gameSession) location.href = '/account/developgame/';
		// 	else location.href = '/account/livelab/';
		// });

		//Update Info
		// socket.on('/#update', function (updateObj) {
		// 	var clientUpdateObj = {};
		//
		// 	//Queue info for UI update
		// 	clientUpdateObj.queueExps = [];
		// 	clientUpdateObj.liveQueueExp = null;
		// 	clientUpdateObj.textTotalRunTime = 0;
		// 	clientUpdateObj.textTotalExps = 0;
		//
		// 	//Bpu Info for UI update
		// 	clientUpdateObj.bpuLiveExp = null;
		// 	clientUpdateObj.bpuLiveFinishTime = 0;
		// 	clientUpdateObj.bpuTextTotalRunTime = 0;
		// 	clientUpdateObj.bpuTextTotalExps = 0;
		//
		// 	//Go through active bpu exps
		// 	updateObj.bpuExps.forEach(function (bpuExp) {
		// 		if (bpuExp.liveBpuExperiment.group_experimentType === 'live') {
		// 			clientUpdateObj.bpuLiveExp = bpuExp;
		// 			clientUpdateObj.bpuLiveFinishTime = bpuExp.liveBpuExperiment.bc_timeLeft;
		// 		} else {
		// 			clientUpdateObj.bpuTextTotalRunTime += bpuExp.liveBpuExperiment.bc_timeLeft;
		// 			clientUpdateObj.bpuTextTotalExps++;
		// 		}
		// 	});
		//
		// 	//Go through queue bpu exps
		// 	updateObj.queueExpTags.forEach(function (expTag) {
		// 		if (expTag.session.sessionID !== null && expTag.session.sessionID !== undefined) {
		// 			if (expTag.group_experimentType === 'live') {
		// 				clientUpdateObj.liveQueueExp = expTag;
		// 			} else {
		// 				clientUpdateObj.textTotalRunTime += expTag.exp_eventsRunTime + expTag.exp_lastResort.totalWaitTime;
		// 				clientUpdateObj.textTotalExps++;
		// 			}
		// 		}
		// 	});
		//
		// 	//Go through bpu groups
		// 	clientUpdateObj.bpusPackage = [];
		// 	updateObj.groupBpus.forEach(function (bpu) {
		// 		clientUpdateObj.bpusPackage.push(bpu);
		// 	});
		// 	app.mainView.updateFromServer(clientUpdateObj);
		//
		// });

		unhook = $rootScope.$on("message", function (e, updates) {
			var bpuUpdates = angular.copy(updates.microscopes);
			var users      = angular.copy(updates.users);

			$scope.$apply(function () {

				vm.users = users;

				lodash.map(vm.activeMicroscopes, function (microscope) {

					var bpu = _.find(bpuUpdates, function (bpu) {
						return bpu.id === microscope.id;
					});

					if (bpu != null) {
						microscope.status = Microscope.BPU_STATUS_DISPLAY[bpu.bpuStatus];

						microscope.allowedGroups               = bpu.allowedGroups;
						microscope.processingTimePerExperiment = bpu.bpu_processingTime;
						microscope.timePending                 = (bpu.timePending > 0 ? bpu.timePending : 0);

						// if (bpu.hasOwnProperty('liveBpuExperiment') && bpu.liveBpuExperiment != null && bpu.liveBpuExperiment.hasOwnProperty('id') && bpu.liveBpuExperiment.id != null) {
						//     vm.microscope.currentExperiment = bpu.liveBpuExperiment;
						//
						//     setTimeout(function(){
						//         var experimentIndex = _.findIndex(vm.microscope.queue, function (experiment) {
						//             return experiment.id = bpu.liveBpuExperiment.id;
						//         });

						// if (experimentIndex < 0) {
						//     vm.microscope.queue.push({
						//         'index':vm.microscope.queue.length,
						//         'id': bpu.liveBpuExperiment.id,
						//         'user': bpu.liveBpuExperiment.username,
						//         'type': bpu.liveBpuExperiment.group_experimentType,
						//         'submittedAt': moment().subtract(bpu.bpu_processingTime / 1000, 'seconds').add(60 - (bpu.liveBpuExperiment.bc_timeLeft / 1000), 'seconds'),
						//         'runTime': bpu.liveBpuExperiment.bc_timeLeft / 1000,
						//         'status': 'in progress'
						//     });
						// }
						// else {
						//         vm.microscope.queue[experimentIndex] = {
						//             'id': bpu.liveBpuExperiment.id,
						//             'user': bpu.liveBpuExperiment.username,
						//             'type': bpu.liveBpuExperiment.group_experimentType,
						//             'submittedAt': moment().subtract(bpu.bpu_processingTime / 1000, 'seconds').add(60 - (bpu.liveBpuExperiment.bc_timeLeft / 1000), 'seconds'),
						//             'runTime': bpu.bpu_processingTime / 1000,
						//             'status': 'in progress'
						//         };
						//     }
						// }, 10000);


						/*
						 "currentExperiment": {
						 "id": "58d49efb4e2de22a9f5caf46",
						 "username": "scripterActivity",
						 "sessionID": null,
						 "bc_timeLeft": 3844,
						 "group_experimentType": "text"
						 },
						 * */

						//
						// workflow.outcome.pending = (experiments[req.params.name] || [])
						//     .filter(function (experiment) {
						//         return experiment.exp_wantsBpuName == req.params.name;
						//     })
						//     .map(function (experiment) {
						//         return {
						//             'bpu': req.params.name,
						//             'user': experiment.user.name,
						//             'type': experiment.group_experimentType,
						//             'submittedAt': experiment.exp_submissionTime,
						//             'runTime': experiment.exp_eventsRunTime,
						//             'status': 'pending'
						//         }
						//     });
					}

				});
			});
		});

		vm.ms2min = function (ms) {
			return Math.floor(ms / 60000);
		};

		vm.ms2s = function (ms) {
			return Math.round(ms / 1000);
		};


		vm.start = function () {
			var errors = false;

			return $q(function (resolve, reject) {
				// $timeout(function() {
				if (!vm.isSubmitting) {
					vm.isSubmitting = true;


					resolve();

				} else {
					vm.isSubmitting = false;
					reject();
				}

				// }, 10000);
			});
		};

		vm.selectMode = function (mode) {
			vm.mode = mode;
		};

		vm.toggle = function (microscope) {
			if (vm.selected && vm.selected.name == microscope.name) {
				vm.selected = null;
			} else {
				vm.selected = microscope;
			}
		};

		vm.file   = null;
		vm.noFile = true;

		vm.upload = function (file) {
			if (window.FileReader) {
				if (file && typeof(file)) {
					var fileReader = new FileReader();
					fileReader.readAsText(file);
					fileReader.onload = loadHandler;
				}
			} else {
				//todo convert to angular error
				alert('FileReader is not supported in this browser.');
			}
		};

		function loadHandler(event) {
			var csv  = event.target.result;
			var file = Papa.parse(csv, {skipEmptyLines: false, header: true, dynamicTyping: true, comments: true});

			// todo validate if file has some data and other checks
			vm.file = file.data;

			// app.mainView.userExpInfo.loadTextFiles = [];
			//
			// me.setLoadTextLabel("Loading " + evt.target.files.length + " file(s)");
			//
			// var availableTextExps = app.mainView.userExpInfo.MaxTextFileLoad - app.mainView.userExpInfo.queueTextFiles;
			// var availableTextRunTime = app.mainView.userExpInfo.MaxTextTime - app.mainView.userExpInfo.queueTextRunTime;
			//
			// console.log(availableTextExps, availableTextRunTime, app.mainView.userExpInfo.MaxTextFileLoad, app.mainView.userExpInfo.queueTextFiles);
			//
			// _loadTextExperiments(availableTextExps, availableTextRunTime, evt.target.files, function(err, loadedTextFilesOutcome) {
			// 	// console.log(err);
			// 	// console.log(loadedTextFilesOutcome);
			//
			// 	if (Math.round(loadedTextFilesOutcome.totalRunTime / 1000) <= 1) {
			// 		err = "Experiment is too short to be executed";
			// 	}
			//
			// 	if (err) {
			// 		me.setLoadTextLabel("Error:" + err, "alert-danger");
			// 		app.mainView.userExpInfo.loadedTextFiles = [];
			// 	} else {
			// 		// console.log("loaded");
			// 		app.mainView.userExpInfo.loadedTextFiles = loadedTextFilesOutcome.fileObjects;
			// 		app.mainView.userExpInfo.loadedTextRunTime = loadedTextFilesOutcome.totalRunTime;
			//
			// 		var secs = Math.round(loadedTextFilesOutcome.totalRunTime / 1000);
			// 		me.setLoadTextLabel("Loaded " + loadedTextFilesOutcome.filesLoaded + " file(s). RunTime:" + secs + " seconds.", "alert-success");
			//
			// 	}
			// });
		}

		vm.validate = function () {
			// always call this function before submitting experiment

			// similiar checks are also done on server side
		};

		$scope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
			if (fromState.name === 'dashboard') {
				$scope.$on('$destroy', unhook);

			}
		});


	}

})();

function submitExperiment(type, microscope, file, machine, user) {
	"use strict";

	var experiment = {
		user:                 {
			id:     user.get('_id'),
			name:   user.get('username'),
			groups: user.get('groups'),
		},
		session:              {
			id:        null,
			sessionID: null,
			socketID:  null,
		},
		group_experimentType: type,
		exp_wantsBpuName:     (microscope == null) ? null : microscope.name,

		exp_eventsToRun: [],
		exp_metaData:    {},

		liveUserLabTime: app.mainConfig.liveUserLabTime, // todo let user pick some duration and cap it

		zeroLedEvent: {
			time:              0,
			topValue:          0,
			rightValue:        0,
			bottomValue:       0,
			leftValue:         0,
			diffuserValue:     0,
			culturelightValue: 0,
			backlightValue:    0,
			ambientlightValue: 0,
			projectorX:        -1,
			projectorY:        -1,
			projectorColor:    0,
			projectorClear:    0
		}
	};

	experiment.exp_metaData.machine              = machine;
	experiment.exp_metaData.type                 = type;
	experiment.exp_metaData.chosenBPU            = (microscope == null) ? null : microscope.name;
	experiment.exp_metaData.selection            = (microscope == null) ? 'auto' : 'user';
	experiment.exp_metaData.tag                  = type; //todo get some user specific tag
	experiment.exp_metaData.group_experimentType = type;
	experiment.exp_metaData.description          = '';
	experiment.exp_metaData.clientCreationDate   = new Date();

	if (type === 'batch') {
		// todo get events to run from file
		// data.exp_eventsToRun        = file.eventsToRun;
		// data.exp_metaData           = file.metaData || {};
	}

	// todo create rest call instead
	socket.emit(socketStrs.submitExperimentRequest, experiment, function (err, validationObjs) {
		if (!didCallback) {
			didCallback = true;

			if (err) {
				console.log(err);
			}

			if (validations && validations.forEach) {
				validations.forEach(function (validation) {
					console.log('runtime: ' + validation.expInfo.exp_eventsRunTime + ', valid:' + validation.expInfo.isValid);

					validation.errs.forEach(function (err) {
						console.log(err);
					});
				});
			}

			$timeout(function () {
				vm.isSubmitting = false;
			}, 2500);
		}
	})
}

//Pop up and time out
// var _joinLabConfirmAlert = function (confirmTimeout, callback) {
// 	if (_joinLabConfirmAlertCalled) {
// 		callback('join lab confirm aleart already called', false);
// 	} else {
// 		_joinLabConfirmAlertCalled = true;
// 		var didCallback = false;
// 		var resTimeout = setTimeout(function () {
// 			if (!didCallback) {
// 				didCallback = true;
// 				_joinLabConfirmAlertCalled = false;
// 				callback('timed out', null);
// 			}
// 		}, confirmTimeout);
// 		//Alert
// 		var confirmTime = Math.round(confirmTimeout / 1000);
// 		if (confirm('Go To Lab.' + new Date() + '\n' + confirmTime + ' seconds to confirm.') === true) {
// 			if (!didCallback) {
// 				didCallback = true;
// 				_joinLabConfirmAlertCalled = false;
// 				callback(null, true);
// 			}
// 		} else {
// 			if (!didCallback) {
// 				didCallback = true;
// 				_joinLabConfirmAlertCalled = false;
// 				callback(null, false);
// 			}
// 		}
// 	}
// };

//Load and Check Text Experiments
// var _loadTextExperiments = function(MaxFileLoad, MaxTime, files, callback) {
// 	var index = -1;
// 	var outcome = {
// 		err: null,
// 		filesLoaded: 0,
// 		totalRunTime: 0,
// 		fileObjects: [],
// 	};
// 	var next = function() {
// 		index++;
// 		if (index < files.length && outcome.filesLoaded < MaxFileLoad && outcome.totalRunTime <= MaxTime) {
// 			var fileObj = {
// 				errTryCatch: null,
// 				errJson: null,
// 				errColumn: null,
// 				eventsToRun: [],
// 				metaData: null,
// 			};
// 			var file = files[index];
// 			var fr = new FileReader();
// 			fr.onload = function() {
// 				try {
// 					_tryJson(fr.result, 0, function(err, fileData) {
// 						if (err) {
// 							fileObj.errJson = "tryJson err:" + err;
// 							_tryColumn(fr.result, function(err, fileData) {
// 								if (err) {
// 									fileObj.errColumn = "tryColumn err:" + err;
// 								} else {
// 									if (fileData.metaData.runTime < 1000) {
// 										fileObj.errColumn = "tryColumn err:" + "time less than 1 second";
// 									} else {
// 										fileObj.errJson = null;
// 										fileObj.errColumn = null;
// 										fileObj.errTryCatch = null;
// 										fileObj.metaData = fileData.metaData;
// 										fileObj.eventsToRun = fileData.eventsToRun;
// 										outcome.totalRunTime += fileData.metaData.runTime;
// 										outcome.filesLoaded++;
// 									}
// 								}
// 							});
// 						} else {
// 							if (fileData.metaData.runTime < 1000) {
// 								fileObj.errColumn = "tryJson err:" + "time less than 1 second";
// 							} else {
// 								fileObj.metaData = fileData.metaData;
// 								fileObj.eventsToRun = fileData.eventsToRun;
// 								outcome.totalRunTime += fileData.metaData.runTime;
// 								outcome.filesLoaded++;
// 							}
// 						}
// 					});
// 				} catch (err) {
// 					fileObj.errTryCatch = err;
// 				} finally {
// 					outcome.err = fileObj.errJson || fileObj.errColumn || fileObj.errTryCatch;
// 					outcome.fileObjects.push(fileObj);
// 					next();
// 				}
// 			};
// 			fr.readAsText(file);
// 		} else {
// 			outcome.totalRunTimeSec = Math.round(outcome.totalRunTime / 1000);
// 			outcome.totalRunTimeMin = Math.round(outcome.totalRunTime / 60000);
// 			callback(outcome.err, outcome);
// 		}
// 	};
// 	next();
// };
// var _tryJson = function(data, tries, cb_fn) {
//
// 	var tryError = null;
// 	var catchError = null;
// 	var fileData = null;
// 	try {
// 		var jsonData = JSON.parse(data);
// 		if (typeof jsonData === 'object') {
// 			//Check for Major Objects
// 			fileData = {
// 				metaData: {},
// 				eventsToRun: [],
// 			};
// 			var keys = Object.keys(jsonData);
// 			var eventsToRun = null;
// 			keys.forEach(function(key) {
// 				if (key === 'metaData') fileData.metaData = jsonData.metaData;
// 				if (key === 'eventsToRun') eventsToRun = jsonData.eventsToRun;
// 			});
// 			//Check Events To Run
// 			if (eventsToRun !== null && typeof eventsToRun.forEach === 'function') {
// 				if (eventsToRun.length === 0) {
// 					tryError = "try JSON LightData Err:" + "No light data in eventsToRun";
// 				} else {
// 					var errDataCheck = null;
//
// 					for (var i = 0; i < eventsToRun.length; i++) {
// 						var dat = eventsToRun[i];
// 						if (true) { //typeof dat.topValue === 'number' && typeof dat.rightValue === 'number' && typeof dat.bottomValue === 'number' && typeof dat.leftValue === 'number' && typeof dat.diffuserValue === 'number' && typeof dat.backlightValue === 'number' && typeof dat.culturelightValue === 'number' && typeof dat.ambientlightValue === 'number' && typeof dat.time === 'number') {
// 							var lightDataObj = {
// 								topValue: dat['topValue'] || 0,
// 								rightValue: dat['rightValue'] || 0,
// 								bottomValue: dat['bottomValue'] || 0,
// 								leftValue: dat['leftValue'] || 0,
// 								diffuserValue: dat['diffuserValue'] || 0,
// 								backlightValue: dat['backlightValue'] || 0,
// 								culturelightValue: dat['culturelightValue'] || 0,
// 								ambientlightValue: dat['ambientlightValue'] || 0,
// 								time: dat['time'] || 0
// 							};
// 							fileData.eventsToRun.push(lightDataObj);
// 						} else {
// 							errDataCheck = "properties needed: topValue rightValue bottomValue leftValue diffuserValue backlightValue culturelightValue ambientlightValue time";
// 							break;
// 						}
// 					}
//
// 					if (errDataCheck === null) {
// 						fileData.eventsToRun.sort(function(a, b) {
// 							return a.time - b.time;
// 						});
//
// 						fileData.metaData.runTime = fileData.eventsToRun[fileData.eventsToRun.length - 1].time - fileData.eventsToRun[0].time;
//
// 						if ((fileData.metaData.runTime <= 0) || (fileData.eventsToRun[fileData.eventsToRun.length - 1].time === 0)) {
// 							tryError = "try JSON LightData Check Err:" + "Zero time length";
// 						} else {
// 							if (fileData.eventsToRun.length === 1) {
// 								var zeroLightDataObj = {
// 									topValue: 0,
// 									rightValue: 0,
// 									bottomValue: 0,
// 									leftValue: 0,
// 									diffuserValue: 0,
// 									backlightValue: 0,
// 									culturelightValue: 0,
// 									ambientlightValue: 0,
// 									time: 0,
// 								};
//
// 								fileData.eventsToRun.push(zeroLightDataObj);
// 							}
//
// 							var timeZero = fileData.eventsToRun[0].time;
//
// 							fileData.eventsToRun.forEach(function(dat) {
// 								dat.time -= timeZero;
// 							});
// 						}
// 					} else {
// 						tryError = "try JSON LightData Check Err:" + errDataCheck;
// 					}
// 				}
// 			} else {
// 				tryError = "try JSON Parse Err:" + "eventsToRun not an object";
// 			}
// 		} else {
// 			tryError = "try JSON Parse Err:" + "jsonData not an object";
// 		}
// 	} catch (err) {
// 		catchError = "catch JSON Parse Err:" + err;
// 	} finally {
// 		if (tryError) {
// 			cb_fn(tryError, null);
// 		} else if (catchError) {
// 			cb_fn(catchError, null);
// 		} else {
// 			cb_fn(null, fileData);
// 		}
// 	}
// };
// var _tryColumn = function(data, cb_fn) {
// 	var jsonData = {
// 		metaData: {},
// 		eventsToRun: []
// 	};
//
// 	var catchErr = null;
//
// 	try {
// 		var header = {};
//
// 		data.split('\n').forEach(function(line) {
//
// 			var colonIndex = line.search(':');
// 			if (colonIndex > -1) {
// 				var key = line.substr(0, colonIndex);
// 				var value = line.substr(colonIndex + 1, line.length);
// 				jsonData.metaData[key] = value;
//
// 			} else {
//
// 				var parts = line.replace(/(\r\n|\n|\r)/gm,"").split(',');
//
// 				var doKeep = true;
//
// 				if (parts.length >= 2) {
//
// 					var check = parts.join('').replace(/\s/g, '');
//
// 					if (check == '') {
// 						doKeep = false;
// 					} else {
// 						parts.forEach(function(part) {
// 							if (part == null) {
// 								doKeep = false;
// 							}
// 						});
// 					}
// 				} else {
// 					doKeep = false;
// 				}
//
// 				var cols = ["time", "topValue", "rightValue", "bottomValue", "leftValue", "diffuserValue", "culturelightValue", "ambientlightValue", "backlightValue"];
//
// 				if (doKeep) {
//
// 					var check = parts.join('').replace(/\s/g, '');
//
// 					if (check.indexOf('time') > -1) {
// 						parts.forEach(function(part) {
// 							if (cols.indexOf(part) > -1) {
// 								header[part] = cols.indexOf(part);
// 							}
// 						});
// 					} else {
// 						if (JSON.stringify(header) !== '{}') {
// 							jsonData.eventsToRun.push({
// 								time: Number(parts[header['time']]),
// 								topValue: Number(parts[header['topValue']] || 0),
// 								rightValue: Number(parts[header['rightValue']] || 0),
// 								bottomValue: Number(parts[header['bottomValue']] || 0),
// 								leftValue: Number(parts[header['leftValue']] || 0),
// 								diffuserValue: Number(parts[header['diffuserValue']] || 0),
// 								backlightValue: Number(parts[header['backlightValue']] || 0),
// 								culturelightValue: Number(parts[header['culturelightValue']] || 0),
// 								ambientlightValue: Number(parts[header['ambientlightValue']] || 0),
// 							});
// 						}
// 					}
// 				}
// 			}
// 		});
// 	} catch (err) {
// 		catchErr = err;
// 	} finally {
// 		if (catchErr) {
// 			cb_fn(catchErr, {});
// 		} else {
// 			if (jsonData.eventsToRun.length > 0) {
// 				_tryJson(JSON.stringify(jsonData), 1, cb_fn);
// 			} else {
// 				cb_fn("No events to run", {});
// 			}
// 		}
// 	}
// };