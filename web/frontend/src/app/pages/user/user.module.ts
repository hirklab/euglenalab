import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { routing }       from './user.routing';

import { User } from './user.component';
import { UserList } from './list/list.component';
import { UserService } from '../../services/user.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing,
    Ng2SmartTableModule,
  ],
  declarations: [
    User,
    UserList,    
  ],
  providers: [
  UserService
  ]
})
export class UserModule {}
