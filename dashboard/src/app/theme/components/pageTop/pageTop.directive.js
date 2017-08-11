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

	            var MESSAGES = {
		            CONNECTED:         'connected',
		            STATUS:            'status',
		            UPDATE:            'update',
		            CONFIRMATION:      'confirmation',
		            LIVE:              'live',
		            EXPERIMENT_SET:    'experimentSet',
		            EXPERIMENT_CANCEL: 'experimentCancel',
		            STIMULUS:          'stimulus',
		            MAINTENANCE:       'maintenance',
		            DISCONNECTED:      'disconnected'
	            };

	            var unhook = $rootScope.$on("message", function (e, message) {
		            if (message) {
			            var type    = message.type;
			            var payload = message.payload;

			            if(type == MESSAGES.STATUS){
				            var users = angular.copy(payload.users);

				            scope.$apply(function () {
					            scope.numUsers = users.length;
				            });
			            }
		            }
	            });

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