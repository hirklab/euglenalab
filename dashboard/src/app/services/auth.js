/**
 * Created by shirish.goyal on 8/28/16.
 */
(function () {
    'use strict';

    angular
        .module('BioLab')
        .service('Auth', Auth);

    Auth.$inject = ['$cookies', '$http', '$q', '$window'];

    function Auth($cookies, $http, $q, $window) {

        var Auth = {
            isAuthenticated: isAuthenticated,
            isAdmin: isAdmin,
            login: login,
            logout: logout,
            register: register,
            changePassword: changePassword,
            forgotPassword: forgotPassword,
            resetPassword: resetPassword,

            getToken: getToken,
            unauthenticate: unauthenticate
        };

        return Auth;

        function register(account) {
            return $http.post('/api/auth/register/', account);
        }

        function login(account) {
            return $http.post('/api/auth/login/', account)
                .success(function(response, status, headers, config){

                    $cookies.put("token", response.token);
                    $cookies.put("user", response);

                    if(response.user.isAdmin) {
                        $cookies.put("isAdmin", true);
                    }
                });
        }

        function logout() {
            return $http.post('/api/auth/logout/')
                .then(logoutSuccessFn, logoutErrorFn);

            function logoutSuccessFn(data, status, headers, config) {
                Auth.unauthenticate();
            }

            function logoutErrorFn(data, status, headers, config) {
                console.error('Epic failure!');
            }
        }

        function unauthenticate() {
            $cookies.remove('token');
            $cookies.remove('user');
            $cookies.remove('isAdmin');

	        $window.location = '#/auth/login';
        }

        function getToken() {
            if (!$cookies.get('token')) {
                return;
            }

            return $cookies.get('token');
        }

        function isAuthenticated() {
            return !!$cookies.get('token');
        }

        function isAdmin() {
            if (!$cookies.get('isAdmin')) {
                return false;
            }

            return $cookies.get('isAdmin');
        }

        // function set(account) {
        //     $http.get('/api/profile/' + account.username + '/')
        //         .success(function (data, status, headers, config) {
        //             account.profile = data;
        //             $cookies.put('authenticatedAccount', JSON.stringify(account));
        //         }).error(function (data, status, headers, config) {
        //         console.error('Could not set profile data');
        //         $cookies.put('authenticatedAccount', JSON.stringify(account));
        //     });
        // }
        //
        // function attachHeaderTokens(settings) {
        //     var tokens = getCookieOauth2Tokens();
        //     settings.headers = {
        //         'Authorization': tokens.token_type + ' ' + tokens.access_token
        //     };
        //     return settings;
        // }

        function changePassword(oldPassword, newPassword, newPassword2) {
            return $http({
                url: '/api/user/' + getAuthenticatedAccount().username + '/change_password/',
                method: 'POST',
                data: {
                    password: oldPassword,
                    password1: newPassword,
                    password2: newPassword2   //no need to transfer this but for now required
                }
            });
        }

        function activateAccount(activation_key) {
            return $http({
                url: '/api/user/activate_account/',
                method: 'POST',
                data: {
                    activation_key: activation_key
                }
            });
        }

        function forgotPassword(email) {
            return $http({
                url: '/api/user/forgot_password/',
                method: 'POST',
                data: {
                    email: email
                }
            });
        }

        function resetPassword(reset_key, email, password) {
            return $http({
                url: '/api/user/reset_password/',
                method: 'POST',
                data: {
                    reset_key: reset_key,
                    email: email,
                    password: password
                }
            });
        }
    }
})();
