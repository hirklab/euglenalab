import { Routes, RouterModule }  from '@angular/router';

import { Auth } from './auth.component';
import { Login } from './login/login.component';
import { Register } from './register/register.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Login,
  },
  {
    path: '',
    component: Register,
  }
];

export const routing = RouterModule.forChild(routes);
