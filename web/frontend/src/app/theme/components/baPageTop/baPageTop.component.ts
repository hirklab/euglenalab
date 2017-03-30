import {Component} from "@angular/core";
import {GlobalState} from "../../../global.state";
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";

import "style-loader!./baPageTop.scss";

@Component({
  selector: 'ba-page-top',
  templateUrl: './baPageTop.html',
})
export class BaPageTop {
  public router: Router;
  public auth: AuthService;
  public isScrolled: boolean = false;
  public isMenuCollapsed: boolean = false;
  public isAuthenticated: boolean = false;
  public user: any = {};

  constructor(private _state: GlobalState, router: Router, auth:AuthService) {
    this.router = router;
    this.auth=auth;
    this.user = this.auth.getUser()||{username:'Anonymous'};
    this.isAuthenticated = this.auth.isAuthenticated();

    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });

    this._state.subscribe('isAuthenticated', (isAuthenticated) => {
      if(!isAuthenticated){
        this.auth.unauthenticate();
        this.router.navigate(['login']);
      }else{
        this.user = this.auth.getUser();
      }
    });
  }

  public toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
    return false;
  }

  public logout() {
    this.isAuthenticated = false;
    this._state.notifyDataChanged('isAuthenticated', this.isAuthenticated);
    return false;
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }
}
