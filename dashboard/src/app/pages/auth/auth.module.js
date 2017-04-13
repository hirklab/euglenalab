/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.auth', [
        'BlurAdmin.pages.auth.services'
    ])
        .config(routeConfig);

    angular.module('BlurAdmin.pages.auth.services', []);

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
                authenticate: false
            })
            .state('auth.register', {
                url: '/register',
                templateUrl: 'app/pages/auth/register.html',
                controller: 'RegisterPageCtrl',
                // controllerAs: 'vm'
            })
            .state('auth.login', {
                url: '/login',
                templateUrl: 'app/pages/auth/login.html',
                controller: 'LoginPageCtrl',
                // controllerAs: 'vm'
            })
        ;
    }

})();
