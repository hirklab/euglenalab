import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import { BaThemeConfigProvider } from '../theme';
import { HttpClient } from '../httpClient';
import { Observable } from 'rxjs/Observable';

import { Subject } from 'rxjs/Subject';
import * as io from 'socket.io-client';

import { LocalStorageService } from 'angular-2-local-storage';

@Injectable()
export class WebsocketService {
	private url = 'ws://localhost:3000';  
  	private socket;

		constructor(private config: BaThemeConfigProvider, private localStorage: LocalStorageService) {
			// this.ws = new $WebSocket("ws://localhost:3001/ws",null, {initialTimeout:10, maxTimeout:10, reconnectIfNotNormalClose:true});
		}

		 getToken() {
			if (!this.localStorage.get('token')) {
				return;
			}

			return this.localStorage.get('token');
		}

		sendMessage(topic, message){
	    this.socket.emit(topic, message);    
	  }

	  getMessages(topic) {
		  let observable = new Observable(observer => {
			  this.socket = io.connect(this.url, {
			  	randomizationFactor:0,
			  	autoConnect:true

			  });
			  this.socket.on('connect', ()=> {
				  this.socket
					  .emit('authenticate', { token: this.getToken() }) //send the jwt

					  .on('authenticated', ()=> {
						  //do other things

						  this.socket.on(topic, (data) => {
							  observer.next(data);
						  });


					  })

					  .on('unauthorized', function(msg) {
						  console.log("unauthorized: " + JSON.stringify(msg.data));
						  throw new Error(msg.data.type);
					  })
				  .on('connect', function() {
					  console.log('connected');
				  })
				  .on('connecting', function() {
					  console.log('connecting');
				  })
				  .on('disconnect', function() {
					  console.log('disconnect');
				  })
				  .on('connect_failed', function() {
					  console.log('connect_failed');
				  })
				  .on('error', function(err) {
					  console.log('error: ' + err);
				  })
				  .on('reconnect_failed', function() {
					  console.log('reconnect_failed');
				  })
				  .on('reconnect', function() {
					  console.log('reconnected ');
				  })
				  .on('reconnecting', function() {
					  console.log('reconnecting');
				  })
					  ;
			  });
			  
			  return () => {
				  this.socket.disconnect();
			  };
		  }).share();     
	    
	    return observable;
	  }  
  

	  

	// initializeWebSocket(url) {
	// 	this.wsObservable = Observable.create((observer) => {
	// 		this.ws = new $WebSocket(url);

	// 		// this.ws.onopen = (e) => {
	// 		// 	console.log("onopen ", e);
 //   //  		};

	// 		// this.ws.onclose = (e) => {
	// 		// 	console.log("onclose ", e);
	// 		// 	if (e.wasClean) {
	// 		// 		observer.complete();
	// 		// 	} else {
	// 		// 		observer.error(e);
	// 		// 	}
	// 		// };

	// 		// this.ws.onerror = (e) => {
	// 		// 	console.log("onerror ", e);
	// 		// 	observer.error(e);
	// 		// }

	// 		this.ws.onMessage = (e) => {
	// 			console.log("onmessage ", e);
	// 			observer.next(JSON.parse(e.data));
	// 		}

	// 		return () => {
	// 			this.ws.close(true);
	// 		};
	// 	}).share();
	// }
}


