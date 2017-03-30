import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';

@Injectable()
export class RoleService {
  constructor(private config: BaThemeConfigProvider, private http: Http) { }

  getAll() {
    return this.http.get(`/api/roles`).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/roles/${id}`).map((response: Response) => response.json());
  }

  create(role: any) {
    return this.http.post('/api/roles', role).map((response: Response) => response.json());
  }

  update(role: any) {
    return this.http.put('/api/roles/' + role.id, role).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/roles/${id}`).map((response: Response) => response.json());
  }
}
