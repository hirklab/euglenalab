/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.experiments', [
        'BlurAdmin.pages.experiments.services'
    ])
        .config(routeConfig);

    angular.module('BlurAdmin.pages.experiments.services', []);

    /** @ngInject */
    function routeConfig($stateProvider) {
        // $stateProvider
        //     .state('experiments', {
        //         url: '/experiments',
        //         templateUrl: 'app/pages/experiments/experiments.html',
        //         title: 'Experiments',
        //         controller: 'ExperimentsPageCtrl',
        //         controllerAs:'vm',
        //         sidebarMeta: {
        //             icon: 'ion-erlenmeyer-flask',
        //             order: 30,
        //         },
        //     });
    }

})();
