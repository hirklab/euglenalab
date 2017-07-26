/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.experiments', [
        'BlurAdmin.pages.experiments.services',
        'BlurAdmin.pages.microscope.services',
	    'BlurAdmin.directives'
    ])
        .config(routeConfig);

    angular.module('BlurAdmin.pages.experiments.services', []);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('experiments', {
                url: '/experiments',
                templateUrl: 'app/pages/experiments/list.html',
                authenticate: true,
                title: 'Experiments',
                controller: 'ExperimentsListCtrl',
                controllerAs:'vm',
                sidebarMeta: {
                    icon: 'ion-erlenmeyer-flask',
                    order: 30,
                },
            })
            .state('experimentDetail', {
                url: '/experiments/:id',
                templateUrl: 'app/pages/experiments/detail.html',
                authenticate: true,
                title: 'Experiments',
                controller: 'ExperimentsDetailCtrl',
                controllerAs:'vm'
            });
    }

})();
