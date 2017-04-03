import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response,URLSearchParams } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';
import {HttpClient} from '../httpClient';

@Injectable()
export class PermissionService {
  constructor(private config: BaThemeConfigProvider, private http: HttpClient) { }

  getAll(options?:any) {
    let params: URLSearchParams = new URLSearchParams();
    for(let key in options){
      params.set(key.toString(), options[key]);
    }
    return this.http.get(`/api/permissions`, {search:params}).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/permissions/${id}`).map((response: Response) => response.json());
  }

  create(permission: any) {
    return this.http.post('/api/permissions', permission).map((response: Response) => response.json());
  }

  update(permission: any) {
    return this.http.put('/api/permissions/' + permission._id, permission).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/permissions/${id}`).map((response: Response) => response.json());
  }
}
