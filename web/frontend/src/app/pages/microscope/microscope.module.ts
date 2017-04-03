import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgaModule} from "../../theme/nga.module";
import {Ng2SmartTableModule} from "ng2-smart-table";
import {routing} from "./microscope.routing";
import {Microscope} from "./microscope.component";
import {MicroscopeList} from "./list/list.component";
import {MicroscopeService} from "../../services/microscope.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing,
    Ng2SmartTableModule,
  ],
  declarations: [
    Microscope,
    MicroscopeList,
  ],
  providers: [
    MicroscopeService
  ]
})
export class MicroscopeModule {
}
