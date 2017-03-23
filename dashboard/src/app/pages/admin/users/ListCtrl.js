/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.admin')
        .controller('UserListCtrl', UserListCtrl);

    /** @ngInject */
    function UserListCtrl($scope, $http, $timeout, $element, User) {

        var vm = this;

        vm.currentPage = 1;
        vm.pageSize = 20;
        vm.users = [];
        vm.displayed = [];

        vm.filter = function (tablestate) {
            vm.getUsers(tablestate);
        };

        vm.getUsers = function (tablestate) {

            var page = Math.floor(tablestate.pagination.start / tablestate.pagination.number);

            User.list(page, vm.pageSize, '').then(function (res) {
                vm.users.concat(res.data.results);
                vm.displayed = [].concat(res.data.results);

                vm.total = res.data.items.total;
                vm.pages = res.data.pages.total;

                tablestate.pagination.start = page * vm.pageSize;
                tablestate.pagination.numberOfPages = vm.pages;
                tablestate.pagination.totalItemCount = vm.total;
                tablestate.pagination.current = Math.floor(tablestate.pagination.start / tablestate.pagination.number);
                vm.currentPage = page;
            });
        };
    }
})();