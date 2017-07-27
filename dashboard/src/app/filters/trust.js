(function () {
	'use strict';

	angular
		.module('BioLab')
		.filter('trust', ['$sce', trust]);
	
	function trust($sce) {
		return function (data) {
			return $sce.trustAsResourceUrl(data);
		}
	}

})();
