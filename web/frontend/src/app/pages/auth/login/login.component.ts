import {Component, ViewEncapsulation} from "@angular/core";
import {FormGroup, AbstractControl, FormBuilder, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import "rxjs/add/operator/toPromise";
import {AuthService} from "../../../services/auth.service";
import {GlobalState} from '../../../global.state';

import "style-loader!./login.scss";

@Component({
  selector: 'login',
  templateUrl: './login.html',
  providers: [AuthService]
})
export class Login {
  public router: Router;
  public auth: AuthService;
  public form: FormGroup;
  public email: AbstractControl;
  public password: AbstractControl;
  public isAuthenticated: boolean = false;
  public submitted: boolean = false;
  public error: String = "";

  constructor(fb: FormBuilder, auth: AuthService, router: Router, private state:GlobalState) {
    this.router = router;
    this.auth = auth;

    this.state.subscribe('isAuthenticated', (isAuthenticated) => {
      this.isAuthenticated = isAuthenticated;

      if(this.isAuthenticated){
        this.router.navigate(['pages/dashboard']);
      }

    });

    this.form = fb.group({
      'email': ['', Validators.compose([Validators.required, Validators.minLength(4)])],
      'password': ['', Validators.compose([Validators.required, Validators.minLength(4)])]
    });

    this.email = this.form.controls['email'];
    this.password = this.form.controls['password'];
  }

  ngOnInit() {
        if(this.auth.isAuthenticated()){
        this.router.navigate(['pages/dashboard']);
    }
  }

  public authenticated(data: Object) {
    this.auth.authenticate(data);
    this.isAuthenticated = true;
    this.state.notifyDataChanged('isAuthenticated', this.isAuthenticated);
    return false;
  }

  public onSubmit(values: Object): void {
    this.submitted = true;

    if (this.form.valid) {
      this.auth.login({'username': values['email'], 'password': values['password']})
        .subscribe(
          response => {
            let data = response.json();
            this.authenticated(data);
          },
          error => {
            let data = error.json();
            this.error=data.message;
          },
          () => {
            // console.log('finished');
          }
        );
    }
  }

  public has_error(field_name: string): boolean {
    let field = this.form.controls[field_name];

    if (field != null) {
      return (field.touched || this.submitted) && field.invalid;
    }

    return false;
  }

}
