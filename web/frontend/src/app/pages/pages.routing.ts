import { Routes, RouterModule }  from '@angular/router';
import { Pages } from './pages.component';
import { ModuleWithProviders } from '@angular/core';
// noinspection TypeScriptValidateTypes

import {AuthGuard} from '../authGuard';

export const routes: Routes = [
   {path: 'login', loadChildren: 'app/pages/auth/login/login.module#LoginModule'},
   {path: 'register', loadChildren: 'app/pages/auth/register/register.module#RegisterModule' },
   // {path: 'forgot', loadChildren: 'app/pages/auth/forgot/forgot.module#ForgotModule' },
   // {path: 'reset', loadChildren: 'app/pages/auth/reset/reset.module#ResetModule' },
  {
    path: 'pages',
    component: Pages,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: 'app/pages/dashboard/dashboard.module#DashboardModule' },
      { path: 'simulation', loadChildren: 'app/pages/simulation/simulation.module#SimulationModule'},
      { path: 'experiments', loadChildren: 'app/pages/experiment/experiment.module#ExperimentModule'},
      { path: 'microscopes', loadChildren: 'app/pages/microscope/microscope.module#MicroscopeModule'},
      { path: 'groups', loadChildren: 'app/pages/group/group.module#GroupModule'},
      { path: 'users', loadChildren: 'app/pages/user/user.module#UserModule'},
      { path: 'roles', loadChildren: 'app/pages/role/role.module#RoleModule'},
      { path: 'permissions', loadChildren: 'app/pages/permission/permission.module#PermissionModule'},
      { path: 'about', loadChildren: 'app/pages/about/about.module#AboutModule'},
    ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
