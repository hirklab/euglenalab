import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';
import {HttpClient} from '../httpClient';

@Injectable()
export class GroupService {
  constructor(private config: BaThemeConfigProvider, private http: HttpClient) { }

  getAll(options?:any) {
    let params: URLSearchParams = new URLSearchParams();
    for(let key in options){
      params.set(key.toString(), options[key]);
    }
    return this.http.get(`/api/groups`, {search:params}).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/groups/${id}`).map((response: Response) => response.json());
  }

  create(group: any) {
    return this.http.post('/api/groups', group).map((response: Response) => response.json());
  }

  update(group: any) {
    return this.http.put('/api/groups/' + group._id, group).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/groups/${id}`).map((response: Response) => response.json());
  }
}
