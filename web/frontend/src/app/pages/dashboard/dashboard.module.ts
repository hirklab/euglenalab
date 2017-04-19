import {NgModule}      from '@angular/core';
import {CommonModule}  from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgaModule} from '../../theme/nga.module';
import { RatingModule } from "ngx-rating";

import {Dashboard} from './dashboard.component';
import {routing}       from './dashboard.routing';

import {MicroscopeService} from "../../services/microscope.service";
import {WebsocketService} from "../../services/websocket.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    RatingModule,
    routing
  ],
  declarations: [
    Dashboard
  ],
  providers: [
    MicroscopeService,
    WebsocketService
  ]
})
export class DashboardModule {
}
