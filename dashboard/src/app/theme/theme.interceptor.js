angular
    .module('BioLab.theme')
    .factory('AuthHttpResponseInterceptor', function ($q, $location, $log, $injector) {
        return {
            request: function (config) {
                var Auth = $injector.get('Auth');
                var token = Auth.getToken();

                if (token != null) {
                    config.headers['Authorization'] = token;
                }

                return config;
            },
            responseError: function (rejection) {
                if (rejection.status === 401) {

                    $log.log(rejection);
                    var $state = $injector.get('$state');
                    var Auth = $injector.get('Auth');

                    Auth.unauthenticate();
                    $state.go('auth.login');

                }

                return $q.reject(rejection);
            }
        }
    });
