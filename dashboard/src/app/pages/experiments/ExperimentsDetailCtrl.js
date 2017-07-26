/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
	'use strict';

	angular.module('BlurAdmin.pages.experiments')
		.controller('ExperimentsDetailCtrl', ExperimentsDetailCtrl);

	/** @ngInject */
	function ExperimentsDetailCtrl($scope, $filter, $location, $stateParams, $window, lodash, Experiment, Microscope) {
		var vm = this;

		Experiment.detail($stateParams.id).then(function (res) {
			vm.experiment = res.data;

			vm.experiment.video_ogg = $location.protocol() + "://" + $location.host() + ":" + ($location.port() - 1) + "/media/finalBpuDataLinks/finalBpuData/" + $stateParams.id + "/tracks_thresholded_10.ogg";
			// vm.video_mp4 = "/media/finalBpuDataLinks/finalBpuData/"+vm.experiment._id+"/tracks_thresholded_10.mp4";
			vm.experiment.video_mp4 = $location.protocol() + "://" + $location.host() + ":" + ($location.port() - 1) + "/media/finalBpuDataLinks/finalBpuData/" + $stateParams.id + "/movie.mp4";
		});

		vm.download = function () {
			$window.open($location.protocol() + "://" + $location.host() + ":" + $location.port() + '/api/experiments/' + vm.experiment._id + '/download/', '_blank');
		}
	}
})();