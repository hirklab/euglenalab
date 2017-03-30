import { Routes, RouterModule }  from '@angular/router';

import { Role } from './role.component';
import { RoleMaster } from './list/roleMaster.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Role,
    children: [
    {path: '', component: RoleMaster},
    // {path: '/:id',  component: RoleMaster }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
