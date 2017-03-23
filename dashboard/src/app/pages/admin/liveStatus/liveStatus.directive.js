/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.admin')
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