export const PAGES_MENU = [
  {
    path: 'pages',
    children: [
      {
        path: 'dashboard',
        data: {
          menu: {
            title: 'Dashboard',
            icon: 'ion-ios-world',
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
            icon: 'ion-ios-flask',
            selected: false,
            expanded: false,
            order: 0
          }
        }
      },
      {
            path: 'groups',
            data: {
              menu: {
                title: 'Groups',
                icon: 'ion-ios-people',
                order: 6
              }
            }
          },
      {
            path: 'users',
            data: {
              menu: {
                title: 'Users',
                icon: 'ion-ios-person',
                order: 7
              }
            }
          },
      
       {
            path: 'roles',
            data: {
              menu: {
                title: 'Roles',
                icon: 'ion-ios-color-filter',
                order: 8
              }
            }
          },
           {
            path: 'permissions',
            data: {
              menu: {
                title: 'Permissions',
                icon: 'ion-lock-combination',
                order: 9
              }
            }
          },
      {
        path: 'about',
        data: {
          menu: {
            title: 'About Us',
            icon: 'ion-ios-information',
            selected: false,
            expanded: false,
            order: 10
          }
        }
      },
    ]
  }
];
