/**
 * Created by shirish.goyal on 8/28/16.
 */
(function () {
	'use strict';

	angular
		.module('BlurAdmin.pages.experiments.services')
		.factory('Experiment', Experiment);

	Experiment.$inject = ['$cookies', '$http', '$q', '$window'];

	function Experiment($cookies, $http, $q, $window) {

		var Experiment = {
			list:       list,
			detail:     detail,
			health:     health,
			queue:      queue,
			addNote:    addNote,
			removeNote: removeNote,
			thresholds: {
				'activity':   [
					{
						min:   75,
						max:   100,
						value: 'progress-bar-danger'
					},
					{
						min:   25,
						max:   75,
						value: 'progress-bar-success'
					},
					{
						min:   0,
						max:   25,
						value: 'progress-bar-warning'
					}
				],
				'population': [
					{
						min:   75,
						max:   100,
						value: 'progress-bar-danger'
					},
					{
						min:   30,
						max:   75,
						value: 'progress-bar-success'
					},
					{
						min:   0,
						max:   30,
						value: 'progress-bar-warning'
					}
				],
				'response':   [
					{
						min:   50,
						max:   100,
						value: 'progress-bar-success'
					},
					{
						min:   25,
						max:   50,
						value: 'progress-bar-warning'
					},
					{
						min:   0,
						max:   25,
						value: 'progress-bar-danger'
					}
				]
			}
		};

		return Experiment;


		function list() {
			return $http.get('/api/experiments/');
		}

		function detail(id) {
			return $http.get('/api/experiments/' + id + '/');
		}

		function health(id) {
			return $http.get('/api/experiments/' + id + '/health/');
		}

		function queue(name) {
			return $http.get('/api/experiments/' + name + '/queue/');
		}

		function addNote(id, message) {
			return $http({
				url:    '/api/experiments/' + id + '/notes/',
				method: 'POST',
				data:   {
					message: message
				}
			});
		}

		function removeNote(id, message) {
			return $http({
				url:    '/api/experiments/' + id + '/notes/' + message._id + '/',
				method: 'DELETE'
			});
		}
	}
})();
