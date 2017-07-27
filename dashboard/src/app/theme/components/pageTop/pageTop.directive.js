(function () {
    'use strict';

    angular.module('BlurAdmin.theme.components')
        .directive('pageTop', pageTop);

    /** @ngInject */
    function pageTop($state) {
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

            }]
        };
    }

})();