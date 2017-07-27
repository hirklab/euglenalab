(function () {
    'use strict';

    angular.module('BioLab.pages.admin')
        .controller('GroupListCtrl', GroupListCtrl);

    /** @ngInject */
    function GroupListCtrl($scope, $http, $timeout, $element, Group) {

        var vm = this;

        vm.currentPage = 1;
        vm.pageSize = 20;
        vm.list = [];
        vm.displayed = [];

        vm.filter = function (tablestate) {
            vm.getList(tablestate);
        };

        vm.getList = function (tablestate) {

            var page = Math.floor(tablestate.pagination.start / tablestate.pagination.number);

            Group.list(page, vm.pageSize, '').then(function (res) {
                // console.log(res.data);
                vm.list.concat(res.data.results);
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