import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebsocketService } from "../../services/websocket.service";

@Component({
  selector: 'dashboard',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
	messages:any=[];
	connection: any = null;

	constructor(protected service: WebsocketService) {
		this.connection = this.service.getMessages('message')
			.subscribe(message => {
			});

		// setInterval(() => {
		// 	if (this.service) {
		// 		this.service.sendMessage('add-message', "testing");
		// 	}
		// }, 5000);
		
  }

	ngOnInit() {
		
	}

	ngOnDestroy() {
		this.connection.unsubscribe();
	}

}
