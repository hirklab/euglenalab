/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.dashboard')
        .directive('microscope', microscope);

    /** @ngInject */
    function microscope() {
        return {
            restrict: 'EA',
            controller: 'MicroscopeCtrl',
            scope: {
                'name': '@name',
                'address': '@address',
                'panelClass': '@panelClass'
            },
            templateUrl: 'app/pages/dashboard/microscope/microscope.html'
        };
    }
})();