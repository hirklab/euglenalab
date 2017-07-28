(function () {
	'use strict';

	angular.module('BioLab.pages.admin')
		.controller('AdminMicroscopeListCtrl', AdminMicroscopeListCtrl);

	/** @ngInject */
	function AdminMicroscopeListCtrl($scope, $http, $timeout, $element, lodash, AdminMicroscope) {

		var vm = this;

		var thresholds = AdminMicroscope.thresholds;

		var findClass = function (statType, value) {
			if (statType !== null && statType !== '' && statType !== undefined) {
				var threshold = thresholds[statType];

				return threshold.find(function (thresh) {
					return thresh.min <= value;
				})['value'];
			} else {
				return '';
			}
		};

		vm.ordering = function (microscope) {
			return parseFloat(microscope.name.replace(/,(?=\d)/g, "").match(/-?\.?\d.*/g));
		};

		AdminMicroscope.list().then(function (res) {
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

						// console.log(stat.statType);

						newValue['percent'] = newValue['value'] * 100 / newValue['max'];
						newValue['class']   = findClass(stat.statType, newValue['percent']);

						return newValue;
					});

					if (microscope.statistics.length <= 0) {
						microscope.statistics = [{}, {}, {}]
					}

					return microscope;
				});

			var microscopeByStatus = lodash.groupBy(microscopes, 'isOn');
			vm.activeMicroscopes   = microscopeByStatus[true];
			vm.inactiveMicroscopes = microscopeByStatus[false];
		});
	}
})();