/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.about', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('about', {
                url: '/about',
                title: 'About Us',
                templateUrl: 'app/pages/about/about.html',
                controller: 'AboutPageCtrl',
                sidebarMeta: {
                    icon: 'ion-information-circled',
                    order: 99,
                },
	            isAdmin:false
            });
    }

})();
