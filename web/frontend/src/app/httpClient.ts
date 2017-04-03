import {Injectable} from "@angular/core";
import {
  Http,
  Headers,
  RequestOptionsArgs,
  Request,
  Response,
  ConnectionBackend,
  BaseRequestOptions,
  RequestMethod,
  RequestOptions
} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {Cookie} from "ng2-cookies/ng2-cookies";

function httpRequest(backend: ConnectionBackend, request: Request): Observable<Response> {
  return backend.createConnection(request).response;
}

function mergeOptions(defaultOpts: BaseRequestOptions, providedOpts: RequestOptionsArgs, method: RequestMethod,
                      url: string): RequestOptions {
  const newOptions = defaultOpts;
  if (providedOpts) {
    // Hack so Dart can used named parameters
    return newOptions.merge(new RequestOptions({
      method: providedOpts.method || method,
      url: providedOpts.url || url,
      search: providedOpts.search,
      // params: providedOpts.params,
      headers: providedOpts.headers,
      body: providedOpts.body,
      withCredentials: providedOpts.withCredentials,
      responseType: providedOpts.responseType
    }));
  }

  return newOptions.merge(new RequestOptions({method, url}));
}

function addCustomHeadersOptions(options: RequestOptionsArgs) {
  if (!options) {
    options = {};
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

function addCustomHeadersRequest(request: Request) {
  if (Cookie.get("token")) {
    if (!request.headers) {
      request.headers = new Headers();
    }

    let token = Cookie.get("token");
    request.headers.set("Authorization", `JWT ${token}`);
  }

  return request;
}


@Injectable()
export class HttpClient extends Http {
  constructor(backend: ConnectionBackend, defaultOptions: RequestOptions) {
    super(backend, defaultOptions);
  }

  request(url: string|Request, options?: RequestOptionsArgs): Observable<Response> {
    let responseObservable: any;

    if (typeof url === 'string') {
      options = addCustomHeadersOptions(options);

      responseObservable = httpRequest(
        this._backend,
        new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, <string>url)));
    } else if (url instanceof Request) {
      url = addCustomHeadersRequest(url);

      responseObservable = httpRequest(this._backend, url);
    } else {
      throw new Error('First argument must be a url string or Request instance.');
    }
    return responseObservable;
  }
}
