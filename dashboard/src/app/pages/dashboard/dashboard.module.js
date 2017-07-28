(function () {
	'use strict';

	angular.module('BioLab.pages.dashboard', [])
		.config(routeConfig);

	/** @ngInject */
	function routeConfig($stateProvider) {
		$stateProvider
			.state('dashboard', {
				url:          '/dashboard',
				templateUrl:  'app/pages/dashboard/dashboard.html',
				title:        'Dashboard',
				controller:   'DashboardPageCtrl',
				controllerAs: 'vm',
				sidebarMeta:  {
					icon:  'ion-android-home',
					order: 0
				},
				authenticate: true
			});
	}

})();
