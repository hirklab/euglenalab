import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';

import { routing }       from './pages.routing';
import { NgaModule } from '../theme/nga.module';

import { Pages } from './pages.component';

import { AuthService } from '../services/auth.service';
import { ExperimentService } from '../services/experiment.service';
import { MicroscopeService } from '../services/microscope.service';
import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';

@NgModule({
  imports: [CommonModule, NgaModule, routing],
  declarations: [Pages],
  providers: [
    AuthService,
    ExperimentService,
    MicroscopeService,
    UserService,
    GroupService,
    RoleService,
    PermissionService
  ]
})
export class PagesModule {
}
