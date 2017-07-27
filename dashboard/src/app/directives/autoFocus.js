(function () {
	'use strict';

	angular
		.module('BioLab')
		.directive('autoFocus', autoFocus);

	

	function autoFocus($timeout) {
		return {
			restrict: 'AC',
			link:     function (scope, element) {
				$timeout(function () {
					element[0].focus();
				}, 0);
			}
		};
	}

	
})();
