import {Injectable} from "@angular/core";
import {Http, Headers, RequestOptionsArgs, Request, Response, ConnectionBackend, RequestOptions} from "@angular/http";
import {Observable} from 'rxjs/Observable';

import {AuthService} from './services/auth.service';

@Injectable()
export class HttpClient extends Http {
  constructor(protected _backend: ConnectionBackend, protected _defaultOptions: RequestOptions, private auth:AuthService) {
    super(_backend, _defaultOptions);
  }

  _setCustomHeaders(options ?: RequestOptionsArgs): RequestOptionsArgs {
    if (!options) {
      options = new RequestOptions({});
    }
    if (this.auth.isAuthenticated()) {

      if (!options.headers) {
        options.headers = new Headers();
      }

      let token = this.auth.getToken();
      options.headers.set("Authorization", `JWT ${token}`);
    }
    return options;
  }

  request(url: string | Request, options ?: RequestOptionsArgs): Observable <Response> {
    options = this._setCustomHeaders(options);
    return super.request(url, options);
  }
}
