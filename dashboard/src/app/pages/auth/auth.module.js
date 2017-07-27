(function () {
    'use strict';

    angular.module('BioLab.pages.auth', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('auth', {
                url: '/auth',
                abstract: true,
                views: {
                    'full_screen': {
                        templateUrl: 'app/pages/auth/auth.html'
                    }
                },
                authenticate: false,
                isAdmin:false
            })
            .state('auth.register', {
                url: '/register',
                templateUrl: 'app/pages/auth/register.html',
                controller: 'RegisterPageCtrl',
                // controllerAs: 'vm'
	            isAdmin:false
            })
            .state('auth.login', {
                url: '/login',
                templateUrl: 'app/pages/auth/login.html',
                controller: 'LoginPageCtrl',
                // controllerAs: 'vm'
	            isAdmin:false
            })
        ;
    }

})();
