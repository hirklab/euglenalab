/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
	'use strict';

	angular.module('BlurAdmin.pages.experiments')
		.controller('ExperimentsListCtrl', ExperimentsListCtrl);

	/** @ngInject */
	function ExperimentsListCtrl($scope, $location, $window, $timeout, lodash, Experiment, Microscope) {
		var vm = this;

		vm.currentPage = 1;
		vm.pageSize    = 10;
		vm.list        = [];
		vm.displayed   = [];
		vm.loading     = true;

		vm.filter = function (tablestate) {
			vm.getList(tablestate);
		};

		vm.getList = function (tablestate) {
			vm.loading = true;

			var page = Math.floor(tablestate.pagination.start / tablestate.pagination.number);

			Experiment.list(page + 1, vm.pageSize, '').then(function (res) {

				vm.experiments = lodash.map(res.data.results, function (experiment) {
					experiment.status = Experiment.STATUS_DISPLAY[experiment.status];
					return experiment;
				});

				vm.list.concat(vm.experiments);
				vm.displayed = [].concat(vm.experiments);

				vm.total = res.data.items.total;
				vm.pages = res.data.pages.total;

				tablestate.pagination.start          = page * vm.pageSize;
				tablestate.pagination.numberOfPages  = vm.pages;
				tablestate.pagination.totalItemCount = vm.total;
				tablestate.pagination.current        = page;

				vm.currentPage = page + 1;

			}).finally(function () {
				$timeout(function () {
					vm.loading = false;
				}, 1000);
			});
		};

		vm.download = function (id) {
			$window.open($location.protocol() + "://" + $location.host() + ":" + $location.port() + '/api/experiments/' + id + '/download/', '_blank');
		}


	}
})();