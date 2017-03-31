import { Routes, RouterModule }  from '@angular/router';

import { Group } from './group.component';
import { GroupList } from './list/list.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Group,
    children: [
    {path: '', component: GroupList},
    // {path: '/:id',  component: RoleMaster }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
