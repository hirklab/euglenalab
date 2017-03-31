import { Routes, RouterModule }  from '@angular/router';

import { User } from './user.component';
import { UserList } from './list/list.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: User,
    children: [
    {path: '', component: UserList},
    // {path: '/:id',  component: RoleMaster }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
