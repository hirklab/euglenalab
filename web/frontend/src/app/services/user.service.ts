import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import {BaThemeConfigProvider} from '../theme';

@Injectable()
export class UserService {
  constructor(private config: BaThemeConfigProvider, private http: Http) { }

  getAll() {
    return this.http.get(`/api/users`).map((response: Response) => response.json());
  }

  getById(id: String) {
    return this.http.get(`/api/users/${id}`).map((response: Response) => response.json());
  }

  create(user: any) {
    return this.http.post('/api/users', user).map((response: Response) => response.json());
  }

  update(user: any) {
    return this.http.put('/api/users/' + user.id, user).map((response: Response) => response.json());
  }

  remove(id: String) {
    return this.http.delete(`/api/users/${id}`).map((response: Response) => response.json());
  }
}
