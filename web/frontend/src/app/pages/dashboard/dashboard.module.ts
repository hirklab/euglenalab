import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';

import { Dashboard } from './dashboard.component';
import { routing }       from './dashboard.routing';

import {PieChart} from './pieChart';;
import {LineChart} from './lineChart';
import {Microscope} from './microscope';

import {LineChartService} from './lineChart/lineChart.service';
import {PieChartService} from './pieChart/pieChart.service';

import {MicroscopeService} from './microscope/microscope.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgaModule,
        routing
    ],
    declarations: [
        PieChart,
        LineChart,
        Microscope,
        Dashboard
    ],
    providers: [
        LineChartService,
        PieChartService,
        MicroscopeService
    ]
})
export class DashboardModule {}
