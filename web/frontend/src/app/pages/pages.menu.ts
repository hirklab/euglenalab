export const PAGES_MENU = [
  {
    path: 'pages',
    children: [
      {
        path: 'dashboard',
        data: {
          menu: {
            title: 'Dashboard',
            icon: 'ion-ios-keypad-outline',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
        path: 'simulation',
        data: {
          menu: {
            title: 'Simulation',
            icon: 'ion-ios-analytics-outline',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
        path: 'experiments',
        data: {
          menu: {
            title: 'Experiments',
            icon: 'ion-ios-list-outline',
            order: 5
          }
        }
      },
      {
        path: 'microscopes',
        data: {
          menu: {
            title: 'Microscopes',
            icon: 'ion-ios-search',
            order: 5
          }
        }
      },
      {
            path: 'groups',
            data: {
              menu: {
                title: 'Groups',
                icon: 'ion-ios-people-outline',
                order: 6
              }
            }
          },
      {
            path: 'users',
            data: {
              menu: {
                title: 'Users',
                icon: 'ion-ios-person-outline',
                order: 7
              }
            }
          },

       {
            path: 'roles',
            data: {
              menu: {
                title: 'Roles',
                icon: 'ion-ios-color-filter-outline',
                order: 8
              }
            }
          },
           {
            path: 'permissions',
            data: {
              menu: {
                title: 'Permissions',
                icon: 'ion-ios-locked-outline',
                order: 9
              }
            }
          },
      {
        path: 'about',
        data: {
          menu: {
            title: 'About Us',
            icon: 'ion-ios-chatbubble-outline',
            selected: false,
            expanded: false,
            order: 10
          }
        }
      },
    ]
  }
];
