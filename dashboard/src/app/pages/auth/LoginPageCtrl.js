/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.auth')
        .controller('LoginPageCtrl', LoginPageCtrl);

    /** @ngInject */
    function LoginPageCtrl($scope, $state, $log, Auth) {

        $scope.account = {};
        $scope.submitted = false;
        $scope.errors = {};

        $scope.signin = signin;
        $scope.has_error = has_error;

        function has_error(field_name) {
            var field = $scope.form[field_name];

            if(field!=null) {
                return (field.$touched || $scope.submitted) && field.$invalid;
            }

            return false;
        }

        function signin(isValid) {
            $scope.submitted = true;

            if (isValid) {
                Auth.login($scope.account).then(function () {
                    // $mdToast.showSimple('Email with an activation link has been sent.');
                    $state.go('admin.microscopeList');
                }, function (response, status) {
                    angular.forEach(response.data.errors, function (errors, field_name) {
                        //Field level errors
                        var field = $scope.form[field_name];
                        field.$setValidity('backend', false);
                        field.$dirty = true;
                        $scope.errors[field_name] = errors.join(', ');
                    });

                }).finally(function () {

                });
            }
        }
    }

})();
