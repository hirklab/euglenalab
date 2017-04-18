import {Injectable} from '@angular/core';
import {BaThemeConfigProvider, colorHelper} from '../../../theme';

@Injectable()
export class MicroscopeService {

    constructor(private _baConfig: BaThemeConfigProvider) {
    }

    getData() {
        let pieColor = this._baConfig.get().colors.custom.dashboardPieChart;

        return [
            {
                name: 'Microscope #1',
                color: pieColor,
                description: 'New Visits',
                stats: '57,820',
                icon: 'person',
            }, {
                name: 'Microscope #2',
                color: pieColor,
                description: 'Purchases',
                stats: '$ 89,745',
                icon: 'social-usd',
            }, {
                name: 'Microscope #3',
                color: pieColor,
                description: 'Active Users',
                stats: '178,391',
                icon: 'ios-pulse-strong',
            }, {
                name: 'Microscope #4',
                color: pieColor,
                description: 'Returned',
                stats: '32,592',
                icon: 'refresh',
            }
        ];
    }
}
