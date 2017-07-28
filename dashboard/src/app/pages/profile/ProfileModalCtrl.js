(function () {
	'use strict';

	angular.module('BioLab.pages.profile')
		.controller('ProfileModalCtrl', ProfileModalCtrl);

	/** @ngInject */
	function ProfileModalCtrl($scope, $uibModalInstance) {
		$scope.link = '';
		$scope.ok   = function () {
			$uibModalInstance.close($scope.link);
		};
	}

})();