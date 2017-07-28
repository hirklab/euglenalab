(function () {
	'use strict';

	angular.module('BioLab.pages.dashboard')
		.controller('DashboardPageCtrl', DashboardPageCtrl);

	/** @ngInject */
	function DashboardPageCtrl($scope, $rootScope, $http, $timeout, $element, lodash, Microscope, socket) {

		var vm        = this;
		vm.connected  = false;
		vm.max        = 5;
		vm.isReadonly = true;

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

		unhook = $rootScope.$on("message", function (e, updates) {

			// console.log('got message');

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


		vm.join = function (microscope) {
			console.log(microscope);
		};

		$scope.$on("$stateChangeStart",
			function (event, toState, toParams, fromState, fromParams) {
				if (fromState.name === 'dashboard') {
					$scope.$on('$destroy', unhook);

				}
			});


	}

})();
