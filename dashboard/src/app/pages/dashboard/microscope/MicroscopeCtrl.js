/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.dashboard')
        .controller('MicroscopeCtrl', MicroscopeCtrl);

    /** @ngInject */
    function MicroscopeCtrl($scope, $http, $timeout, $element) {
        $scope.name = $scope.name || 'Microscope';
        $scope.address = $scope.address || '';
        $scope.panelClass = $scope.panelClass || 'medium-panel with-scroll';
    }
})();