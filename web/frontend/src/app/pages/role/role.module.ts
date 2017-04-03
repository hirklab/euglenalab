import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgaModule} from "../../theme/nga.module";
import {Ng2SmartTableModule} from "ng2-smart-table";
import {routing} from "./role.routing";
import {Role} from "./role.component";
import {RoleList} from "./list/list.component";
import {RoleService} from "../../services/role.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing,
    Ng2SmartTableModule,
  ],
  declarations: [
    Role,
    RoleList,
  ],
  providers: [
    RoleService
  ]
})
export class RoleModule {
}
