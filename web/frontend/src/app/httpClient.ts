import {Injectable} from "@angular/core";
import {Http, Headers, RequestOptionsArgs, Request, Response, ConnectionBackend, RequestOptions} from "@angular/http";
import {Observable} from 'rxjs/Observable';

import {Cookie} from 'ng2-cookies/ng2-cookies';

@Injectable()
export class HttpClient extends Http {
  constructor(protected _backend: ConnectionBackend, protected _defaultOptions: RequestOptions) {
    super(_backend, _defaultOptions);
  }

  _setCustomHeaders(options ?: RequestOptionsArgs): RequestOptionsArgs {
    if (!options) {
      options = new RequestOptions({});
    }
    if (Cookie.get("token")) {

      if (!options.headers) {
        options.headers = new Headers();
      }

      let token = Cookie.get("token");
      options.headers.set("Authorization", `JWT ${token}`);
    }
    return options;
  }

  request(url: string | Request, options ?: RequestOptionsArgs): Observable <Response> {
    options = this._setCustomHeaders(options);
    return super.request(url, options);
  }
}
