import {Component} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {NgIf} from '@angular/common';
import {Router, RouterModule} from '@angular/router';

function mustMatch(controlName: string, matchingControlName: string) {
  return (controls: AbstractControl): ValidationErrors | null => {
    const control = controls.get(controlName);
    const matchingControl = controls.get(matchingControlName);

    if (!control?.value && matchingControl?.value) return null;
    if (matchingControl?.errors && !matchingControl.errors['mustMatch']) {
      return null;
    }
    if (control?.value !== matchingControl?.value) {
      return {
        mustMatch: true
      }
    } else {
      return null;
    }
  }
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    NgIf,
    FormsModule,
    RouterModule,

  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(20)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      invitationCode: ['']
    }, {
      validator: mustMatch('password', 'confirmPassword')
    })
  }

  register(){
    if (this.registerForm.valid) {
      // 处理注册逻辑
      console.log('Form data:', this.registerForm.value);
      alert('Registration successful!');
      // this.router.navigate(['/login']);
    } else {
      // 触发所有字段的验证

      console.log('Form is invalid');
    }
  }

  get username(){
    return this.registerForm.controls['username']
  }
  get email(){
    return this.registerForm.controls['email']
  }

  get password(){
    return this.registerForm.controls['password']
  }
  get confirmPassword(){
    return this.registerForm.controls['confirmPassword']
  }

  registerByTwitter(event: MouseEvent) {
    event.preventDefault();
    // pass
  }
  registerByGoogle(event: MouseEvent) {
    event.preventDefault();
    // pass
  }
  registerByWeChat(event: MouseEvent) {
    event.preventDefault();
    // pass
  }
}
