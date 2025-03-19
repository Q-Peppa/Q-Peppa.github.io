import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  errorMessage = ''
  username = '';
  password = '';
  constructor(private router: Router) {}


  login() {
    if (this.username === 'admin' && this.password === 'admin') {
      localStorage.setItem('username', this.username);
      localStorage.setItem('password', this.password);
      // 登录成功
      this.errorMessage = '';
      this.router.navigate(['/blog-list']).then(r => {}); // 假设你的博客列表路由是 '/blog-list'
    } else {
      // 登录失败
      this.errorMessage = 'Invalid username or password.';
    }
  }
}
