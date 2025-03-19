import {Component, inject, OnInit} from '@angular/core';
import {CartItemComponent} from '../components/cart-item/cart-item.component';
import {NgForOf} from '@angular/common';
import {BlogService,Article} from '../service/blog.service';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  imports: [
    CartItemComponent,
    NgForOf,
  ],
  styleUrls: ['./blog-list.component.css']
})
export class BlogListComponent implements OnInit {

  articles:Article[] | undefined  = undefined ;
  blogQuery: BlogService = inject(BlogService)
  constructor() {
  }

  ngOnInit(): void {
    this.blogQuery.getAllBlog().subscribe(pre =>{
      // console.log(pre);
      this.articles = pre;
    })
  }
}
