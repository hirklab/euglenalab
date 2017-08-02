(function () {
    'use strict';

    angular.module('BioLab.theme.components')
        .directive('pageTop', pageTop);

    /** @ngInject */
    function pageTop($state, $rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'app/theme/components/pageTop/pageTop.html',
            scope: {
                onLogout: '&'
            },
            controller: ['$scope', 'Auth', function(scope, Auth) {
                scope.onLogout  = function () {
	                Auth.unauthenticate();
                };

                scope.numUsers = 0;



                // scope.socket = socket;
                //
                // scope.$watch(socket.isConnected, function(newVal, oldVal){
                // 	console.log(socket);
                // 	console.log(newVal);
                //
                // 	if(newVal!==oldVal && newVal!= null){
		         //        scope.isConnected = newVal;
	             //    }
                // })

	            var unhook = $rootScope.$on("message", function (e, updates) {

		            var users      = angular.copy(updates.users);

		            scope.$apply(function () {
			            scope.numUsers = users.length;
		            });
	            });

            }]
        };
    }

})();