/**
 * @author shirish.goyal
 * created on 22.12.2016
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.admin')
        .controller('LiveStatusCtrl', LiveStatusCtrl);

    /** @ngInject */
    function LiveStatusCtrl($scope, $element, baConfig, layoutPaths, lodash) {
        var layoutColors = baConfig.colors;
        var node = $element.children()[0];
        var name='';

        $scope.$watch('bpuName', function(value){
            if (value != undefined && value != null && value != '') {
                name=value;
            }
        }, true);

        $scope.$watch('experimentsData', function (value) {
            if (value != undefined && value != null && value != '') {
                // console.log(value);

                var experiments = JSON.parse(value);
                createGanttChart(node, name, experiments);
            }
        }, true);

        function createGanttChart(node, name, experimentsData) {
            var data = data || {};
            data["category"] = lodash.toUpper(name);
            data["segments"] = data["segments"] || [];

            experimentsData.forEach(function (experiment) {
                data["segments"].push({
                    "start": moment(experiment.submittedAt).format('YYYY-MM-DD HH:mm:ss'),
                    "end": moment(experiment.submittedAt).add(60, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
                    "duration":60,
                    "color": experiment.type == 'live' ? layoutColors.primary : layoutColors.warning,
                    "task": lodash.toLower(experiment.user)
                });

            });

            console.log(data);

            // var data = [
            //     {
            //         "category": "John",
            //         "segments": [{
            //             "start": 7,
            //             "duration": 2,
            //             "color": "#46615e",
            //             "task": "Task #1"
            //         }, {
            //             "duration": 2,
            //             "color": "#727d6f",
            //             "task": "Task #2"
            //         }, {
            //             "duration": 2,
            //             "color": "#8dc49f",
            //             "task": "Task #3"
            //         }]
            //     }, {
            //         "category": "Smith",
            //         "segments": [{
            //             "start": 10,
            //             "duration": 2,
            //             "color": "#727d6f",
            //             "task": "Task #2"
            //         }, {
            //             "duration": 1,
            //             "color": "#8dc49f",
            //             "task": "Task #3"
            //         }, {
            //             "duration": 4,
            //             "color": "#46615e",
            //             "task": "Task #1"
            //         }]
            //     }];

            AmCharts.baseHref = true;

            var chart = AmCharts.makeChart(node, {
                "type": "gantt",
                "theme": "light",
                "marginRight": 70,
                "period": "DD",
                "dataDateFormat": "YYYY-MM-DD JJ:NN:SS",
                "balloonDateFormat": "JJ:NN",
                "columnWidth": 1,
                "valueAxis": {
                    "type": "date"
                },
                "brightnessStep": 10,
                "graph": {
                    "fillAlphas": 1,
                    "lineAlpha": 1,
                    "lineColor": "#fff",
                    "balloonText": "<b>[[task]]</b>"
                },
                "rotate": true,
                "categoryField": "category",
                "segmentsField": "segments",
                "colorField": "color",
                // "startDate": "2017-02-01",
                "startDateField": "start",
                "endDateField": "end",
                // "durationField": "duration",
                "dataProvider": [data],
                "valueScrollbar": {
                    "autoGridCount": true
                },
                "chartCursor": {
                    "cursorColor": "#55bb76",
                    "valueBalloonsEnabled": false,
                    "cursorAlpha": 0,
                    "valueLineAlpha": 0.5,
                    "valueLineBalloonEnabled": true,
                    "valueLineEnabled": true,
                    "zoomable": false,
                    "valueZoomable": true
                },
                "export": {
                    "enabled": true
                }
            });

            return chart;
        }
    }

})();
