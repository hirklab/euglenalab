import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';

@Injectable()
export class PermissionService {
  constructor(private config: BaThemeConfigProvider, private http: Http) { }

  getAll() {
    return this.http.get(`/api/permissions`).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/permissions/${id}`).map((response: Response) => response.json());
  }

  create(role: any) {
    return this.http.post('/api/permissions', role).map((response: Response) => response.json());
  }

  update(role: any) {
    return this.http.put('/api/permissions/' + role.id, role).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/permissions/${id}`).map((response: Response) => response.json());
  }
}
