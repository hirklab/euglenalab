/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.dashboard', [
        'BlurAdmin.pages.admin.services',
        'BlurAdmin.pages.services',
        'BlurAdmin.pages.microscope.services',
    ])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('dashboard', {
                url: '/dashboard',
                templateUrl: 'app/pages/dashboard/dashboard.html',
                title: 'Dashboard',
                controller: 'DashboardPageCtrl',
                controllerAs:'vm',
                sidebarMeta: {
                    icon: 'ion-android-home',
                    order: 0,
                },
                authenticate: true
            });
    }

})();
