(function () {
	'use strict';

	angular.module('BioLab.pages.profile', [])
		.config(routeConfig);

	/** @ngInject */
	function routeConfig($stateProvider) {
		$stateProvider
			.state('profile', {
				url:         '/profile',
				title:       'Profile',
				templateUrl: 'app/pages/profile/profile.html',
				controller:  'ProfilePageCtrl',
			});
	}

})();
