(function () {
	'use strict';

	angular
		.module('BioLab')
		.directive('compareTo', compareTo);

	/**
	 * @name compareTo
	 * @desc Show error if two values are not same
	 */
	function compareTo() {
		return {
			require:  "ngModel",
			restrict: 'A',
			scope:    {
				compareTo: '='
			},
			link:     function (scope, elem, attrs, ctrl) {
				if (!ctrl) {
					console && console.warn('Match validation requires ngModel to be on the element');
					return;
				}

				scope.$watch(function () {
					var modelValue = angular.isUndefined(ctrl.$modelValue) ? ctrl.$$invalidModelValue : ctrl.$modelValue;
					return (ctrl.$pristine && angular.isUndefined(modelValue)) || scope.compareTo === modelValue;
				}, function (currentValue) {
					ctrl.$setValidity('compareTo', currentValue);
				});
			}
		};
	}

})();
