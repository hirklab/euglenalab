/**
 * Created by shirish.goyal on 8/28/16.
 */
(function () {
    'use strict';

    angular
        .module('BioLab')
        .factory('AdminMicroscope', AdminMicroscope);

    AdminMicroscope.$inject = ['$cookies', '$http', '$q', '$window'];

    function AdminMicroscope($cookies, $http, $q, $window) {

        var AdminMicroscope = {
            list: list,
            detail: detail,
            health: health,
            queue: queue,
            addNote: addNote,
            removeNote: removeNote,
            BPU_STATUS_DISPLAY: {
                'initializing': 'initializing',
                'pendingRun': 'in queue',
                'running': 'running',
                'finalizing': 'processing',
                'finalizingDone': 'processing over',
                'resetingDone': 'ready',
                'offline': 'offline'
            },
            thresholds: {
                'activity': [
                    {
                        min: 75,
                        max: 100,
                        value: 'progress-bar-danger'
                    },
                    {
                        min: 25,
                        max: 75,
                        value: 'progress-bar-success'
                    },
                    {
                        min: 0,
                        max: 25,
                        value: 'progress-bar-warning'
                    }
                ],
                'population': [
                    {
                        min: 75,
                        max: 100,
                        value: 'progress-bar-danger'
                    },
                    {
                        min: 30,
                        max: 75,
                        value: 'progress-bar-success'
                    },
                    {
                        min: 0,
                        max: 30,
                        value: 'progress-bar-warning'
                    }
                ],
                'response': [
                    {
                        min: 50,
                        max: 100,
                        value: 'progress-bar-success'
                    },
                    {
                        min: 25,
                        max: 50,
                        value: 'progress-bar-warning'
                    },
                    {
                        min: 0,
                        max: 25,
                        value: 'progress-bar-danger'
                    }
                ]
            }
        };

        return AdminMicroscope;


        function list() {
            return $http.get('/api/microscopes/');
        }

        function detail(id) {
            return $http.get('/api/microscopes/' + id);
        }

        function health(id, startDate, endDate) {
            return $http.get('/api/microscopes/' + id + '/health/?start=' + startDate + "&end=" + endDate);
        }

        function queue(name) {
            return $http.get('/api/microscopes/' + name + '/queue/');
        }

        function addNote(id, message) {
            return $http({
                url: '/api/microscopes/' + id + '/notes/',
                method: 'POST',
                data: {
                    message: message
                }
            });
        }

        function removeNote(id, message) {
            return $http({
                url: '/api/microscopes/' + id + '/notes/' + message._id,
                method: 'DELETE'
            });
        }
    }
})();
