import {Component, Input, OnInit, OnDestroy, OnChanges} from '@angular/core';
import _ from 'lodash';
import {MicroscopeService} from "../../services/microscope.service";
import {WebsocketService} from "../../services/websocket.service";

import "style-loader!./dashboard.scss";


interface IMessage {
  type: string;
  payload: any;
}

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.html',
  inputs: ['microscopes']
})
export class Dashboard implements OnInit, OnDestroy, OnChanges {
  messages: Array<IMessage> = [];
  @Input() microscopes: any = [];
  wsConnection: any = null;
  dataConnection: any = null;

  constructor(protected ws: WebsocketService, protected service: MicroscopeService) {
    this.wsConnection = this.ws.getMessages('message')
      .subscribe(message => {
        let type = message['type'];
        let payload = message['payload'];

        console.log(`[RX] ${type}`);
        console.log(payload);

        switch (type) {
          case 'status':
            this.onStatus(payload);
            break;

          // case MESSAGE.EXPERIMENT_SET:
          // 	this.onExperimentSet(payload);
          // 	break;

          // case MESSAGE.EXPERIMENT_CANCEL:
          // 	this.onExperimentCancel(payload);
          // 	break;

          // case MESSAGE.EXPERIMENT_RUN:
          // 	this.onExperimentRun(payload);
          // 	break;

          // case MESSAGE.STIMULUS:
          // 	this.onStimulus(payload);
          // 	break;

          // case MESSAGE.EXPERIMENT_CLEAR:
          // 	this.onExperimentClear(payload);
          // 	break;

          // case MESSAGE.MAINTENANCE:
          // 	this.onMaintenance(payload);
          // 	break;

          // case MESSAGE.DISCONNECTED:
          //   this.onDisconnected(payload);
          //   break;

          default:
            // logger.warn(`invalid message: message type not handled`);
            break;
        }

      });

    this.loadData();
  }

  ngOnInit() {

  }

  ngOnChanges(changes) {
    console.log(changes);
  }

  onStatus(payload) {
    if ('hid' in payload) {
      let microscopeIndex = _.findIndex(this.microscopes, {identification: payload['hid']});
      if (microscopeIndex >= 0) {
        this.microscopes[microscopeIndex] = Object.assign(this.microscopes[microscopeIndex], payload);
      }
    }
  }

  ngOnDestroy() {
    this.wsConnection.unsubscribe();
    this.dataConnection.unsubscribe();
  }

  loadData(): void {
    let params = {
      page: 1,
      limit: 1000
    };

    this.dataConnection = this.service.getAll(params).subscribe((data) => {
      this.microscopes = data.docs;

      _.each(this.microscopes, (microscope) => {
        if (microscope.hasOwnProperty('publicAddress') && microscope.publicAddress != null && microscope.publicAddress.hasOwnProperty('ip') && microscope.publicAddress.ip != null) {
          microscope.address = `http://${microscope.publicAddress.ip}:${microscope.publicAddress.cameraPort}?action=snapshot`; //+ (microscope.snapshot ? 'snapshot' : 'stream');
        } else {
          microscope.address = '/assets/img/bpu-disabled.jpg';
        }
      })

    });
  }

}
