import {Routes, RouterModule} from "@angular/router";
import {Experiment} from "./experiment.component";
import {ExperimentList} from "./list/list.component";

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: Experiment,
    children: [
      {path: '', component: ExperimentList},
    ]
  }
];

export const routing = RouterModule.forChild(routes);
