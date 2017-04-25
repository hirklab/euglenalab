/**
 * @author shirish.goyal
 * created on 22.12.2016
 */
(function() {
    'use strict';

    angular.module('BlurAdmin.pages.admin')
        .controller('HealthChartCtrl', HealthChartCtrl);

    /** @ngInject */
    function HealthChartCtrl($scope, $element, baConfig, layoutPaths, AdminMicroscope) {
        var layoutColors = baConfig.colors;
        var node = $element.children()[0];

        var endDate = moment().toISOString();
        var startDate = moment().subtract(1, 'month').toISOString();

        $scope.$watch('microscopeData', function(value) {
            if (value != undefined && value.length > 0) {
                var microscope = JSON.parse(value);
                AdminMicroscope.health(microscope.id, startDate, endDate).then(function(response) {
                    createHealthChart(node, response.data.results);
                });
            }
        }, true);

        function createHealthChart(node, data) {

            var chart = AmCharts.makeChart(node, {
                "type": "serial",
                "theme": "none",
                "color": layoutColors.default,
                "dataDateFormat": "YYYY-MM-DD HH:mm:ss",
                "precision": 2,
                "valueAxes": [{
                    color: layoutColors.default,
                    axisColor: layoutColors.default,
                    gridColor: layoutColors.default,
                    "id": "v1",
                    "title": "Value",
                    "position": "left",
                    "autoGridCount": false,
                    "labelFunction": function(value) {
                        return "" + Math.round(value) + "";
                    }
                }],
                "graphs": [{
                    "id": "g3",
                    color: layoutColors.default,
                    "valueAxis": "v1",
                    "lineColor": layoutColors.danger,
                    "fillColors": layoutColors.danger,
                    "fillAlphas": 0.9,
                    "lineAlpha": 0.9,
                    "type": "smoothedLine",
                    "title": "Activity",
                    "valueField": "activity",
                    "clustered": false,
                    "columnWidth": 1,
                    "lineColorField": layoutColors.danger,
                    "legendValueText": "[[value]]",
                    "balloonText": "[[title]]<br/><b style='font-size: 130%'>[[value]]</b>"
                }, {
                    "id": "g4",
                    "valueAxis": "v1",
                    color: layoutColors.default,
                    "lineColor": layoutColors.success,
                    "fillColors": layoutColors.success,
                    "fillAlphas": 0.7,
                    "lineAlpha": 0.9,
                    "type": "smoothedLine",
                    "title": "Population",
                    "valueField": "population",
                    "clustered": false,
                    "columnWidth": 1,
                    "lineColorField": layoutColors.success,
                    "legendValueText": "[[value]]",
                    "balloonText": "[[title]]<br/><b style='font-size: 130%'>[[value]]</b>"
                }, {
                    "id": "g1",
                    "valueAxis": "v1",
                    color: layoutColors.default,
                    "lineColor": layoutColors.warning,
                    "fillColors": layoutColors.warning,
                    "fillAlphas": 0.5,
                    "lineAlpha": 0.9,
                    "type": "smoothedLine",
                    "title": "Response",
                    "valueField": "response",
                    "columnWidth": 1,
                    "lineColorField": layoutColors.warning,
                    "legendValueText": "[[value]]",
                    "balloonText": "[[title]]<br/><b style='font-size: 130%'>[[value]]</b>"
                }],
                "chartScrollbar": {
                    graph: "g1",
                    oppositeAxis: false,
                    offset: 30,
                    gridAlpha: 0,
                    color: layoutColors.default,
                    scrollbarHeight: 50,
                    backgroundAlpha: 0,
                    selectedBackgroundAlpha: 0.05,
                    selectedBackgroundColor: layoutColors.default,
                    graphFillAlpha: 0,
                    autoGridCount: true,
                    selectedGraphFillAlpha: 0,
                    graphLineAlpha: 0.2,
                    selectedGraphLineColor: layoutColors.default,
                    selectedGraphLineAlpha: 1
                },
                "chartCursor": {
                    "pan": true,
                    "cursorColor": layoutColors.danger,
                    "valueLineEnabled": true,
                    "valueLineBalloonEnabled": true,
                    "cursorAlpha": 0,
                    "valueLineAlpha": 0.2
                },
                "categoryField": "datetime",
                "categoryAxis": {
                    "axisColor": layoutColors.default,
                    "color": layoutColors.default,
                    "gridColor": layoutColors.default,
                    "parseDates": true,
                    "minPeriod": "hh",
                    "dashLength": 1,
                    "minorGridEnabled": true
                },
                "legend": {
                    "useGraphSettings": false,
                    "switchable": true,
                    "position": "top",
                    "color": layoutColors.default
                },
                "balloon": {
                    "borderThickness": 1,
                    "shadowAlpha": 0
                },
                "export": {
                    "enabled": true
                },
                "dataProvider": data,
                pathToImages: layoutPaths.images.amChart
            });

            return chart;
        }


    }

})();