import {RequestOptions, Headers, Http, BaseRequestOptions} from '@angular/http';
import {Cookie} from 'ng2-cookies/ng2-cookies';

export class AuthorizedRequestOptions extends BaseRequestOptions {
  constructor() {
    super();

    if (Cookie.get("token")) {
      let token = Cookie.get("token");
      this.headers.append("Authorization", `JWT ${token}`);
    }
  }
}

