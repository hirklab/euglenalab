(function () {
	'use strict';

	angular.module('BioLab.pages.livelab', [])
		.config(routeConfig);

	/** @ngInject */
	function routeConfig($stateProvider) {
		$stateProvider
			.state('livelab', {
				url:          '/livelab/:id',
				templateUrl:  'app/pages/livelab/index.html',
				title:        'Live Experiment',
				controller:   'LiveLabCtrl',
				controllerAs: 'vm',
				// sidebarMeta: {
				//     icon: 'ion-android-home',
				//     order: 0
				// },
				authenticate: true
			});
	}

})();
