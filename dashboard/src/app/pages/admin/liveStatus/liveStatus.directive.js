(function () {
    'use strict';

    angular.module('BioLab.pages.admin')
        .directive('liveStatus', liveStatus);

    /** @ngInject */
    function liveStatus() {
        return {
            restrict: 'EA',
            template: '<div class="admin-chart"></div>',
            controller: 'LiveStatusCtrl',
            scope: {
                experimentsData: '@',
                bpuName:'@'
            }
        };
    }
})();