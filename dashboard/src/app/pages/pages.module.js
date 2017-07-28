(function () {
	'use strict';

	angular.module('BioLab.pages', [
		'ui.router',

		'BioLab.pages.dashboard',
		// 'BioLab.pages.profile',
		'BioLab.pages.about',
		'BioLab.pages.auth',
		'BioLab.pages.experiments',
		'BioLab.pages.livelab',
		// 'BioLab.pages.simulation',
		'BioLab.pages.admin'
	])
		.config(routeConfig);

	/** @ngInject */
	function routeConfig($urlRouterProvider, baSidebarServiceProvider) {
		$urlRouterProvider.otherwise('/auth/login');

		// baSidebarServiceProvider.addStaticItem({
		//   title: 'Pages',
		//   icon: 'ion-document',
		//   subMenu: [{
		//     title: 'Sign In',
		//     fixedHref: 'auth.html',
		//     blank: true
		//   }, {
		//     title: 'Sign Up',
		//     fixedHref: 'reg.html',
		//     blank: true
		//   }, {
		//     title: 'User Profile',
		//     stateRef: 'profile'
		//   }, {
		//     title: '404 Page',
		//     fixedHref: '404.html',
		//     blank: true
		//   }]
		// });

		// baSidebarServiceProvider.addStaticItem({
		//   title: 'Menu Level 1',
		//   icon: 'ion-ios-more',
		//   subMenu: [{
		//     title: 'Menu Level 1.1',
		//     disabled: true
		//   }, {
		//     title: 'Menu Level 1.2',
		//     subMenu: [{
		//       title: 'Menu Level 1.2.1',
		//       disabled: true
		//     }]
		//   }]
		// });
	}

})();
