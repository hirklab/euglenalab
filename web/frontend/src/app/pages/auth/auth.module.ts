import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';

import { routing }       from './auth.routing';
import { Auth } from './auth.component';
import { AuthService } from './auth.service';
import { Login } from './login/login.component';
import { Register } from './register/register.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing
  ],
  declarations: [
    Auth,
    Login,
    Register
  ],
  providers: [
    AuthService
  ]
})
export class AuthModule {}
