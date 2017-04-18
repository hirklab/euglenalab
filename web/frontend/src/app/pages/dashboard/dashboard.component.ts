import { Component, OnInit, OnDestroy } from '@angular/core';
import _ from 'lodash';
import { MicroscopeService } from "../../services/microscope.service";
import { WebsocketService } from "../../services/websocket.service";

import "style-loader!./dashboard.scss";

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
	messages:any=[];
	microscopes:any=[];
	wsConnection: any = null;
	dataConnection: any = null;

	constructor(protected ws: WebsocketService, protected service:MicroscopeService) {
		this.wsConnection = this.ws.getMessages('message')
			.subscribe(message => {
			  console.log(message);
			});

		this.loadData();
  }

	ngOnInit() {

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

      _.each(this.microscopes, (microscope)=>{
        if (microscope.hasOwnProperty('publicAddress') && microscope.publicAddress != null && microscope.publicAddress.hasOwnProperty('ip') && microscope.publicAddress.ip != null) {
          microscope.address = `http://${microscope.publicAddress.ip}:${microscope.publicAddress.cameraPort}?action=snapshot`; //+ (microscope.snapshot ? 'snapshot' : 'stream');
        } else {
          microscope.address = '/assets/img/bpu-disabled.jpg';
        }
      })

    });
  }

}
