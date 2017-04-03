import {Routes, RouterModule} from "@angular/router";
import {Microscope} from "./microscope.component";
import {MicroscopeList} from "./list/list.component";

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Microscope,
    children: [
      {path: '', component: MicroscopeList},
    ]
  }
];

export const routing = RouterModule.forChild(routes);
