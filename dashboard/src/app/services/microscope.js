/**
 * Created by shirish.goyal on 8/28/16.
 */
(function () {
    'use strict';

    angular
        .module('BioLab')
        .factory('Microscope', Microscope);

    Microscope.$inject = ['$cookies', '$http', '$q', '$window'];

    function Microscope($cookies, $http, $q, $window) {

        var Microscope = {
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
                'offline': 'offline',
                'unknown': 'offline'
            },
            THRESHOLDS: {
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
            },
	        MESSAGES : {
                TX:{
	                EXPERIMENT_SET: 'experimentSet',
	                EXPERIMENT_CANCEL: 'experimentCancel', // can be shifted to experiments page
	                EXPERIMENT_CONFIRMATION: 'experimentConfirmation',
	                EXPERIMENT_EXTEND_DURATION: 'experimentExtendDuration',
	                EXPERIMENT_TRANSFER_CONTROL: 'experimentTransferControl',
	                STIMULUS: 'stimulus',
	                MAINTENANCE: 'maintenance'
                },
                RX:{
	                CONNECTED: 'connected',
	                STATUS: 'status',
	                EXPERIMENT_CONFIRM: 'experimentConfirm',
	                EXPERIMENT_LIVE: 'experimentLive',
	                DISCONNECTED: 'disconnected'
                }
	        }
        };

        return Microscope;


        function list() {
            return $http.get('/api/microscopes/?isActive=true');
        }

        function detail(id) {
            return $http.get('/api/microscopes/' + id + '/');
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
