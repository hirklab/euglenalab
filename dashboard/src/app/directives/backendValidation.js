(function () {
	'use strict';

	angular
		.module('BioLab')
		.directive('backendValidity', backendValidity);


	/**
	 * @name backendError
	 * @desc Clear backend error if input value has been modified.
	 *       This helps in ensuring field is re-validated from backend
	 */
	function backendValidity() {
		return {
			restrict: 'A',
			require:  '?ngModel',
			link:     function (scope, element, attrs, ctrl) {
				return element.on('change', function () {
					return scope.$apply(function () {
						return ctrl.$setValidity('backend', true);
					});
				});
			}
		};
	}

})();
