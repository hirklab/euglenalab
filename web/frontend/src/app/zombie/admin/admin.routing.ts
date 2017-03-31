import { Routes, RouterModule }  from '@angular/router';

import { Admin } from './admin.component';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      // { path: 'bubblemaps', component: BubbleMaps },
      // { path: 'googlemaps', component: GoogleMaps },
      // { path: 'leafletmaps', component: LeafletMaps },
      // { path: 'linemaps', component: LineMaps }
    ]
  }
];

export const routing = RouterModule.forChild(routes);
