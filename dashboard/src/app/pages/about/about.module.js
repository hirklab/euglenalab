(function () {
	'use strict';

	angular.module('BioLab.pages.about', [])
		.config(routeConfig);

	/** @ngInject */
	function routeConfig($stateProvider) {
		$stateProvider
			.state('about', {
				url:         '/about',
				title:       'About Us',
				templateUrl: 'app/pages/about/about.html',
				controller:  'AboutPageCtrl',
				sidebarMeta: {
					icon:  'ion-information-circled',
					order: 99,
				},
				isAdmin:     false
			});
	}

})();
