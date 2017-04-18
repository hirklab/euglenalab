import {Component, ViewEncapsulation} from '@angular/core';

import {MicroscopeService} from './microscope.service';

import './microscope.loader.ts';

@Component({
  selector: 'microscope-list',
  encapsulation: ViewEncapsulation.None,
  styles: [require('./microscope.scss')],
  template: require('./microscope.html')
})

export class Microscope {

  public microscopes: Array<Object>;
  private _init = false;

  constructor(private _microscopeService: MicroscopeService) {
    this.microscopes = this._microscopeService.getData();
  }

  ngAfterViewInit() {
    if (!this._init) {
      this._loadMicroscopeList();
      this._updateMicroscopeList();
      this._init = true;
    }
  }

  private _loadMicroscopeList() {

    jQuery('.chart').each(function () {
      let chart = jQuery(this);
      chart.easyPieChart({
        easing: 'easeOutBounce',
        onStep: function (from, to, percent) {
          jQuery(this.el).find('.percent').text(Math.round(percent));
        },
        barColor: jQuery(this).attr('data-rel'),
        trackColor: 'rgba(0,0,0,0)',
        size: 84,
        scaleLength: 0,
        animation: 2000,
        lineWidth: 9,
        lineCap: 'round',
      });
    });
  }

  private _updateMicroscopeList() {
    let getRandomArbitrary = (min, max) => { return Math.random() * (max - min) + min; };

    jQuery('.pie-charts .chart').each(function(index, chart) {
      jQuery(chart).data('easyPieChart').update(getRandomArbitrary(55, 90));
    });
  }
}
