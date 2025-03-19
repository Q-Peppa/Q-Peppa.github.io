import {Component, inject, OnInit, Injector, InjectionToken, Output, EventEmitter} from '@angular/core';
import {MarkdownComponent, MarkdownModule, MarkdownService} from 'ngx-markdown';
import {ActivatedRoute, ParamMap, Router, RouterLink} from '@angular/router';
import {Article, BlogService} from '../service/blog.service';
import {Observable, switchMap} from 'rxjs';
import {AsyncPipe, NgIf,} from '@angular/common';

const MY_VALUE_TOKEN = new InjectionToken<string>('MyValue');

const injector = Injector.create({
  providers:[{
    provide: MY_VALUE_TOKEN,
    useValue:"VALUE"
  }]
})
@Component({
  selector: 'app-blog-info',
  imports: [
    MarkdownComponent,
    AsyncPipe,
    RouterLink,
  ],
  templateUrl: './blog-info.component.html',
  styleUrl: './blog-info.component.css'
})
export class BlogInfoComponent implements OnInit {
  blog$: Observable<Article | undefined> | undefined  ;
  route = inject(ActivatedRoute)
  blogQuery: BlogService = inject(BlogService)
  text: string = injector.get(MY_VALUE_TOKEN)


  ngOnInit() {
    this.blog$ = this.route.paramMap.pipe(
      switchMap((params:ParamMap)=>{
        const blogId = params.get('id')
        return this.blogQuery.getBlogById(Number(blogId))
      })
    )
  }
}
