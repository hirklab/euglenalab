import {Routes, RouterModule} from "@angular/router";
import {Role} from "./role.component";
import {RoleList} from "./list/list.component";

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Role,
    children: [
      {path: '', component: RoleList},
      // {path: '/:id',  component: RoleList }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
