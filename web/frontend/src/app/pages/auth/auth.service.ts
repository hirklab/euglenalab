import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';

import { Cookie } from 'ng2-cookies/ng2-cookies';

import {BaThemeConfigProvider} from '../../theme';


@Injectable()
export class AuthService {

  constructor(private _baConfig: BaThemeConfigProvider, private http: Http) {
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
      Cookie.set('token',response.token);
      Cookie.set('user',JSON.stringify(response.user));
  }

  public unauthenticate() {
    Cookie.delete('token');
    Cookie.delete('user');
  }

  public getUser() {
    if (!Cookie.get('user')) {
      return;
    }

    return JSON.parse(Cookie.get('user'));
  }

  public getToken() {
    if (!Cookie.get('token')) {
      return;
    }

    return Cookie.get('token');
  }

  public isAuthenticated() {
    return !!Cookie.get('token');
  }
}
