import { Routes, RouterModule }  from '@angular/router';
import { Pages } from './pages.component';
import { ModuleWithProviders } from '@angular/core';
// noinspection TypeScriptValidateTypes

import {AuthGuard} from '../authGuard';

// export function loadChildren(path) { return System.import(path); };

export const routes: Routes = [
 { 
   path: 'login',
   // canDeactivate: [AuthGuard], 
   loadChildren: 'app/pages/auth/login/login.module#LoginModule'
 },
  { path: 'register', loadChildren: 'app/pages/auth/register/register.module#RegisterModule' },
  
  {

    path: 'pages',
    component: Pages,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
     
      { path: 'dashboard', loadChildren: 'app/pages/dashboard/dashboard.module#DashboardModule' },
      { path: 'about', loadChildren: 'app/pages/about/about.module#AboutModule'},
      { path: 'simulation', loadChildren: 'app/pages/simulation/simulation.module#SimulationModule'},
      { path: 'editors', loadChildren: 'app/pages/editors/editors.module#EditorsModule' },
      { path: 'components', loadChildren: 'app/pages/components/components.module#ComponentsModule' },
      { path: 'charts', loadChildren: 'app/pages/charts/charts.module#ChartsModule' },
      { path: 'ui', loadChildren: 'app/pages/ui/ui.module#UiModule' },
      { path: 'forms', loadChildren: 'app/pages/forms/forms.module#FormsModule' },
      { path: 'tables', loadChildren: 'app/pages/tables/tables.module#TablesModule' },
      { path: 'maps', loadChildren: 'app/pages/maps/maps.module#MapsModule' }
    ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
