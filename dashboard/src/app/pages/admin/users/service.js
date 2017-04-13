/**
 * Created by shirish.goyal on 8/28/16.
 */
(function () {
    'use strict';

    angular
        .module('BlurAdmin.pages.admin.services')
        .factory('User', User);

    User.$inject = ['$cookies', '$http', '$q', '$window'];

    function User($cookies, $http, $q, $window) {

        var User = {
            list: list,
            detail: detail,
            add: add,
            remove: remove
        };

        return User;


        function list(page, count, search) {
            return $http.get('/api/users/?page=' + page + "&limit=" + count + "&search=" + search);
        }

        function detail(id) {
            return $http.get('/api/users/' + id);
        }

        function add(id, message) {
            return $http({
                url: '/api/users/' + id + '/notes/',
                method: 'POST',
                data: {
                    message: message
                }
            });
        }

        function remove(id, message) {
            return $http({
                url: '/api/users/' + id + '/notes/' + message._id,
                method: 'DELETE'
            });
        }
    }
})();
