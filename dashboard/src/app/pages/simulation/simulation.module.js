(function () {
    'use strict';

    angular.module('BioLab.pages.simulation', [])
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
