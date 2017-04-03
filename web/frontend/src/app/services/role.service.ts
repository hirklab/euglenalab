import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';
import {HttpClient} from '../httpClient';

@Injectable()
export class RoleService {
  constructor(private config: BaThemeConfigProvider, private http: HttpClient) { }

  getAll(options?:any) {
    let params: URLSearchParams = new URLSearchParams();
    for(let key in options){
      params.set(key.toString(), options[key]);
    }
    return this.http.get(`/api/roles`, {search:params}).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/roles/${id}`).map((response: Response) => response.json());
  }

  create(role: any) {
    return this.http.post('/api/roles', role).map((response: Response) => response.json());
  }

  update(role: any) {
    return this.http.put('/api/roles/' + role._id, role).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/roles/${id}`).map((response: Response) => response.json());
  }
}
