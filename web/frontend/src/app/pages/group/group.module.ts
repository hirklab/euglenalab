import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { routing }       from './group.routing';

import { Group } from './group.component';
import { GroupList } from './list/list.component';
import { GroupService } from '../../services/group.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing,
    Ng2SmartTableModule,
  ],
  declarations: [
    Group,
    GroupList,    
  ],
  providers: [
  GroupService
  ]
})
export class GroupModule {}
