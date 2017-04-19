import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgaModule} from "../../theme/nga.module";
import {Ng2SmartTableModule} from "ng2-smart-table";
import { MomentModule, TimeAgoPipe } from 'angular2-moment';

import {routing} from "./experiment.routing";
import {Experiment} from "./experiment.component";
import {ExperimentList} from "./list/list.component";
import {ExperimentService} from "../../services/experiment.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing,
    MomentModule,
    Ng2SmartTableModule,
  ],
  declarations: [
    Experiment,
    ExperimentList,
  ],
  providers: [
    ExperimentService
  ]
})
export class ExperimentModule {
}
