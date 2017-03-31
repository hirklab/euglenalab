import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';

@Injectable()
export class GroupService {
  constructor(private config: BaThemeConfigProvider, private http: Http) { }

  getAll() {
    return this.http.get(`/api/groups`).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/groups/${id}`).map((response: Response) => response.json());
  }

  create(group: any) {
    return this.http.post('/api/groups', group).map((response: Response) => response.json());
  }

  update(group: any) {
    return this.http.put('/api/groups/' + group.id, group).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/groups/${id}`).map((response: Response) => response.json());
  }
}
