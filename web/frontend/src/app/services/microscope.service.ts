import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';
import {HttpClient} from '../httpClient';

@Injectable()
export class MicroscopeService {
  constructor(private config: BaThemeConfigProvider, private http: HttpClient) { }

  getAll(options?:any) {
    let params: URLSearchParams = new URLSearchParams();
    for(let key in options){
      params.set(key.toString(), options[key]);
    }
    return this.http.get(`/api/microscopes`, {search:params}).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/microscopes/${id}`).map((response: Response) => response.json());
  }

  create(microscope: any) {
    return this.http.post('/api/microscopes', microscope).map((response: Response) => response.json());
  }

  update(microscope: any) {
    return this.http.put('/api/microscopes/' + microscope._id, microscope).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/microscopes/${id}`).map((response: Response) => response.json());
  }
}
