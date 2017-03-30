import {Injectable} from "@angular/core";
import {Router, CanActivate} from "@angular/router";
import {AuthService} from "./services/auth.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private auth:AuthService) {
  }

  canActivate() {
    if (this.auth.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }

  // canDeactivate() {
  //   if (this.isAuthenticated()) {
  //     this.router.navigate(['pages/dashboard']);
  //     return false;
  //   } else {
  //     return true;
  //   }
  // }
}
