(function () {
    'use strict';

    angular.module('BioLab.pages.admin', [])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider, $urlRouterProvider) {
        // var isAdmin = !!$cookies.get('token') && $cookies.get('isAdmin');

        // if(isAdmin) {
            $stateProvider
                .state('admin', {
                    url:         '/admin',
                    template:    '<ui-view></ui-view>',
                    abstract:    true,
                    controller:  'AdminPageCtrl',
                    // authenticate: true,
                    title:       'Admin',
                    sidebarMeta: {
                        icon:  'ion-settings',
                        order: 80
                    },
                    isAdmin:     true
                })
                .state('admin.microscopeList', {
                    url:          '/microscopes',
                    templateUrl:  'app/pages/admin/microscope/list.html',
                    authenticate: true,
                    controller:   'AdminMicroscopeListCtrl',
                    controllerAs: 'vm',
                    title:        'Microscopes',
                    sidebarMeta:  {
                        order: 0
                    },
                    isAdmin:      true
                })
                .state('admin.microscopeDetail', {
                    url:          '/microscopes/:id',
                    templateUrl:  'app/pages/admin/microscope/detail.html',
                    authenticate: true,
                    controller:   'AdminMicroscopeDetailCtrl',
                    controllerAs: 'vm',
                    title:        'Microscope',
                    isAdmin:      true
                })
                .state('admin.userList', {
                    url:          '/users',
                    templateUrl:  'app/pages/admin/users/list.html',
                    authenticate: true,
                    controller:   'UserListCtrl',
                    controllerAs: 'vm',
                    title:        'Users',
                    sidebarMeta:  {
                        order: 10
                    },
                    isAdmin:      true
                })
                .state('admin.userDetail', {
                    url:          '/users/:id',
                    templateUrl:  'app/pages/admin/users/detail.html',
                    authenticate: true,
                    controller:   'UserDetailCtrl',
                    controllerAs: 'vm',
                    title:        'Users',
                    isAdmin:      true
                })
                .state('admin.groupList', {
                    url:          '/groups',
                    templateUrl:  'app/pages/admin/groups/list.html',
                    authenticate: true,
                    controller:   'GroupListCtrl',
                    controllerAs: 'vm',
                    title:        'Groups',
                    sidebarMeta:  {
                        order: 20
                    },
                    isAdmin:      true
                })
                .state('admin.groupDetail', {
                    url:          'groups/:id',
                    templateUrl:  'app/pages/admin/groups/detail.html',
                    authenticate: true,
                    controller:   'GroupDetailCtrl',
                    controllerAs: 'vm',
                    title:        'Groups',
                    isAdmin:      true
                })
            ;

            $urlRouterProvider.when('/admin', '/admin/microscopes');
        // }

    }

})();
