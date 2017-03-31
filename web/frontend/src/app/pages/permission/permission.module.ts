import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgaModule} from "../../theme/nga.module";
import {Ng2SmartTableModule} from "ng2-smart-table";
import {routing} from "./permission.routing";
import {Permission} from "./permission.component";
import {PermissionList} from "./list/list.component";
import {PermissionService} from "../../services/permission.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing,
    Ng2SmartTableModule,
  ],
  declarations: [
    Permission,
    PermissionList,
  ],
  providers: [
    PermissionService
  ]
})
export class PermissionModule {
}
