(function () {
    'use strict';

    angular.module('BlurAdmin.theme.components')
        .directive('pageTop', pageTop);

    pageTop.$inject = ['$cookies', '$state'];

    /** @ngInject */
    function pageTop($cookies, $state) {
        return {
            restrict: 'E',
            templateUrl: 'app/theme/components/pageTop/pageTop.html',
            scope: {
                onLogout: '&'
            },
            link: function(scope, elem, attrs) {
                scope.onLogout  = function () {
                    $cookies.remove('token');
                    $cookies.remove('user');

                    $state.go('dashboard');
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

            }
        };
    }

})();