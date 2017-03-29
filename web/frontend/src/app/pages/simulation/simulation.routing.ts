import { Routes, RouterModule }  from '@angular/router';

import { Simulation } from './simulation.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Simulation
  }
];

export const routing = RouterModule.forChild(routes);
