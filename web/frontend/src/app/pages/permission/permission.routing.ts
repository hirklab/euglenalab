import {Routes, RouterModule} from "@angular/router";
import {Permission} from "./permission.component";
import {PermissionList} from "./list/list.component";

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Permission,
    children: [
      {path: '', component: PermissionList},
      // {path: '/:id',  component: RoleMaster }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
