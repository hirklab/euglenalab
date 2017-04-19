import { Component } from '@angular/core';
import { Routes } from '@angular/router';

import { BaMenuService } from '../theme';
import { PAGES_MENU } from './pages.menu';
import { AuthService } from "../services/auth.service";
import * as _ from 'lodash';

@Component({
  selector: 'pages',
  template: `
    <ba-sidebar></ba-sidebar>
    <ba-page-top></ba-page-top>
    <div class="al-main">
      <div class="al-content">
        <ba-content-top></ba-content-top>
        <router-outlet></router-outlet>
      </div>
    </div>
    <footer class="al-footer clearfix">
      <div class="al-footer-right">© 2017 Riedel-Kruse Lab, Stanford University</div>
      <div class="al-footer-main clearfix">
        <!--<ul class="al-share clearfix">-->
          <!--<li><i class="socicon socicon-facebook"></i></li>-->
          <!--<li><i class="socicon socicon-twitter"></i></li>-->
          <!--<li><i class="socicon socicon-google"></i></li>-->
          <!--<li><i class="socicon socicon-github"></i></li>-->
        <!--</ul>-->
      </div>
    </footer>
    <ba-back-top position="200"></ba-back-top>
    `
})
export class Pages {

  constructor(private _menuService: BaMenuService, private auth: AuthService) {
  }

  ngOnInit() {
    if (this.auth.isAuthenticated()) {

      let user = this.auth.getUser();

      //allocated permissions to this user
      let permissions = [];
      if (user && _.has(user, 'roles') && user.roles.length>0) {
        _.each(user.roles, (role) => {

          if (_.has(role, 'permissions')) {
            _.each(role.permissions, (permission) => {
              permissions.push(permission.name);
            })
          }

        });
      }

      let routes = _.cloneDeep(PAGES_MENU);

      // all permiited routes based on the permissions assigned to the user
      let permittedRoutes = _.map(routes, (route)=>{
          if(_.has(route,'children')){
              route.children = _.filter(route.children, (subroute)=>{
                if (subroute && _.has(subroute, 'permissions') && subroute['permissions'].length>0) {
                  return (_.intersection(subroute['permissions'], permissions).length > 0);
                } else {
                  return true;
                }
              });
          }

          if(_.has(route, 'permissions')){
            if (route.permissions.length > 0 && _.intersection(route.permissions, permissions).length == 0) {
              return;
            }else{
              return route;
            }
          }else{
            return route;
          }
      });

      this._menuService.updateMenuByRoutes(<Routes>permittedRoutes);
    }
  }
}
