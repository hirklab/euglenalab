import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';

import { Cookie } from 'ng2-cookies/ng2-cookies';
import { LocalStorageService } from 'angular-2-local-storage';

import {BaThemeConfigProvider} from '../theme';


@Injectable()
export class AuthService {

  constructor(private _baConfig: BaThemeConfigProvider, private http: Http, private localStorage: LocalStorageService) {
  }

  public register(account) {
    return this.http.post('/api/auth/register/', account);
  }

  public login(account) {
    return this.http.post('/api/auth/login/', account);
  }

  public logout() {
    return this.http.post('/api/auth/logout/', {});
  }

  public authenticate(response){
    this.localStorage.set('token', response.token);
    this.localStorage.set('user', response.user);
  }

  public unauthenticate() {
    this.localStorage.remove('token');
    this.localStorage.remove('user');
  }

  public getUser() {
    if (!this.localStorage.get('user')) {
      return;
    }

    return this.localStorage.get('user');
  }

  public getToken() {
    if (!this.localStorage.get('token')) {
      return;
    }

    return this.localStorage.get('token');
  }

  public isAuthenticated() {
    return !!this.localStorage.get('token');
  }
}
