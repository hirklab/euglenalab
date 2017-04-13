/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.simulation', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        // $stateProvider
        //     .state('simulation', {
        //         url: '/simulation',
        //         title: 'Simulation',
        //         templateUrl: 'app/pages/simulation/simulation.html',
        //         controller: 'SimulationPageCtrl',
        //         sidebarMeta: {
        //             icon: 'ion-cube',
        //             order: 40,
        //         },
        //     });
    }

})();
