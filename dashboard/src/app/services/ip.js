(function () {
	'use strict';

	angular
		.module('BioLab')
		.service('ip', function ($http) {
			return $http.get('http://ipinfo.io/json');
		})

})();