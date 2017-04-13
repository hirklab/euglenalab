export const PAGES_MENU = [
  {
    path: 'pages',
    permissions: [],
    children: [
      {
        path: 'dashboard',
        data: {
          menu: {
            title: 'Dashboard',
            icon: 'ion-ios-keypad-outline',
            order: 0
          }
        },
        permissions: []
      },
      // {
      //   path: 'simulation',
      //   data: {
      //     menu: {
      //       title: 'Simulation',
      //       icon: 'ion-ios-analytics-outline',
      //       order: 5,
      //     }
      //   },
      //   permissions:['simulation.menu']
      // },
      {
        path: 'experiments',
        data: {
          menu: {
            title: 'Experiments',
            icon: 'ion-ios-list-outline',
            order: 10
          }
        },
        permissions: ['experiments.menu']
      },
      {
        path: 'microscopes',
        data: {
          menu: {
            title: 'Microscopes',
            icon: 'ion-ios-search',
            order: 15
          }
        },
        permissions: ['microscopes.menu']
      },
      {
        path: 'groups',
        data: {
          menu: {
            title: 'Groups',
            icon: 'ion-ios-people-outline',
            order: 20
          }
        },
        permissions: ['groups.menu']
      },
      {
        path: 'users',
        data: {
          menu: {
            title: 'Users',
            icon: 'ion-ios-person-outline',
            order: 25
          }
        },
        permissions: ['users.menu']
      },
      {
        path: 'roles',
        data: {
          menu: {
            title: 'Roles',
            icon: 'ion-ios-color-filter-outline',
            order: 30
          }
        },
        permissions: ['roles.menu']
      },
       {
        path: 'permissions',
        data: {
          menu: {
            title: 'Permissions',
            icon: 'ion-ios-locked-outline',
            order: 35
          }
        },
        permissions: ['permissions.menu']
      },
      {
        path: 'about',
        data: {
          menu: {
            title: 'About Us',
            icon: 'ion-ios-chatbubble-outline',
            order: 10
          }
        }
      },
    ]
  }
];
