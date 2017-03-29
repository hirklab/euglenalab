import {Injectable} from "@angular/core";
import {Router, CanActivate} from "@angular/router";
import {Cookie} from "ng2-cookies/ng2-cookies";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {
  }

  isAuthenticated() {
    return !!Cookie.get('token');
  }

  canActivate() {
    if (this.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
