/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.experiments')
        .controller('ExperimentsPageCtrl', ExperimentsPageCtrl);

    /** @ngInject */
    function ExperimentsPageCtrl($scope, $filter, Experiment) {
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

            Experiment.list(page, vm.pageSize, '').then(function (res) {
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