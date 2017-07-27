(function () {
    'use strict';

    angular.module('BioLab.pages.admin')
        .directive('healthChart', healthChart);

    /** @ngInject */
    function healthChart() {
        var datetimeInput = function(format, model, dateOptions){
            return  '<div class="col-md-6">' +
                '<p class="input-group">' +
                '<input type="text" class="form-control" uib-datepicker-popup="{{format}}" ng-model="dt" is-open="popup1.opened" datepicker-options="dateOptions" ng-required="true" close-text="Close" />' +
                '<span class="input-group-btn">' +
                '<button type="button" class="btn btn-default" ng-click="open1()"><i class="glyphicon glyphicon-calendar"></i></button>' +
                '</span>' +
                '</p></div>';
        };

        return {
            restrict: 'EA',
            template:
            '<div class="admin-chart"></div>',
            controller: 'HealthChartCtrl',
            scope: {
                microscopeData: '@'
            }
        };
    }
})();