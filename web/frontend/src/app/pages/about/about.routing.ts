import { Routes, RouterModule }  from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { About } from './about.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: About,
    children:[]
  }
];

export const routing:ModuleWithProviders = RouterModule.forChild(routes);
