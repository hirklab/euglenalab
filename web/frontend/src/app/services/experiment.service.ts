import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';
import {HttpClient} from '../httpClient';

@Injectable()
export class ExperimentService {
  constructor(private config: BaThemeConfigProvider, private http: HttpClient) { }

  getAll(options?:any) {
    let params: URLSearchParams = new URLSearchParams();
    for(let key in options){
      params.set(key.toString(), options[key]);
    }
    return this.http.get(`/api/experiments`, {search:params}).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/experiments/${id}`).map((response: Response) => response.json());
  }

  create(experiment: any) {
    return this.http.post('/api/experiments', experiment).map((response: Response) => response.json());
  }

  update(experiment: any) {
    return this.http.put('/api/experiments/' + experiment._id, experiment).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/experiments/${id}`).map((response: Response) => response.json());
  }
}
