/**
 * Created by shirish.goyal on 8/28/16.
 */
(function () {
    'use strict';

    angular
        .module('BlurAdmin.pages.admin.services')
        .factory('Group', Group);

    Group.$inject = ['$cookies', '$http', '$q', '$window'];

    function Group($cookies, $http, $q, $window) {

        var Group = {
            list: list,
            detail: detail,
            add: add,
            remove: remove
        };

        return Group;


        function list(page, count, search) {
            return $http.get('/api/groups/?page=' + page + "&limit=" + count + "&search=" + search);
        }

        function detail(id) {
            return $http.get('/api/groups/' + id);
        }

        function add(id, message) {
            return $http({
                url: '/api/groups/' + id + '/notes/',
                method: 'POST',
                data: {
                    message: message
                }
            });
        }

        function remove(id, message) {
            return $http({
                url: '/api/groups/' + id + '/notes/' + message._id,
                method: 'DELETE'
            });
        }
    }
})();
