import { Injectable } from '@angular/core';

import { BaThemeConfigProvider } from './theme.configProvider';
import { colorHelper } from './theme.constants';

@Injectable()
export class BaThemeConfig {

  constructor(private _baConfig: BaThemeConfigProvider) {
  }

  config() {
        this._baConfig.changeTheme({name: 'light'});

        let colorScheme = {
            primary: '#209e91',
            info: '#2dacd1',
            success: '#90b900',
            warning: '#dfb81c',
            danger: '#e85656',
        };

        this._baConfig.changeColors({
            default: '#dddddd',
            defaultText: '#999999',
            border: '#d6d6d6',
            borderDark: '#aaaaaa',

            primary: colorScheme.primary,
            info: colorScheme.info,
            success: colorScheme.success,
            warning: colorScheme.warning,
            danger: colorScheme.danger,

            primaryLight: colorHelper.tint(colorScheme.primary, 30),
            infoLight: colorHelper.tint(colorScheme.info, 30),
            successLight: colorHelper.tint(colorScheme.success, 30),
            warningLight: colorHelper.tint(colorScheme.warning, 30),
            dangerLight: colorHelper.tint(colorScheme.danger, 30),

            primaryDark: colorHelper.shade(colorScheme.primary, 15),
            infoDark: colorHelper.shade(colorScheme.info, 15),
            successDark: colorHelper.shade(colorScheme.success, 15),
            warningDark: colorHelper.shade(colorScheme.warning, 15),
            dangerDark: colorHelper.shade(colorScheme.danger, 15),

            dashboard: {
                blueStone: '#209e91',
                surfieGreen: '#2dacd1',
                silverTree: '#90b900',
                gossip: '#dfb81c',
                white: '#e85656',
            },

            custom: {
                dashboardLineChart: colorScheme.primary,
                dashboardPieChart: colorScheme.primary
            }
        });
    }
}
