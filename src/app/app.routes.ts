import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import {BlogListComponent} from './blog-list/blog-list.component';
import {BlogInfoComponent} from './blog-info/blog-info.component';
import {Page404Component} from './core/page-404/page-404.component';
export const routes: Routes = [
  {
    path:'',
    pathMatch:'full',
    redirectTo:'/login',
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path:'register',
    component: RegisterComponent
  },
  { path: 'blog-list', component: BlogListComponent },
  { path: 'blog-list/:id', component: BlogInfoComponent },
  {
    path: '**',
    redirectTo: '404',
  },
  {
    path: '404',
    component: Page404Component
  }

];
