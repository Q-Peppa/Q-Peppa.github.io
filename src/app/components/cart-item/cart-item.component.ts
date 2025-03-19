import {Component, Input,} from '@angular/core';
import {DatePipe, NgIf,} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-cart-item',
  imports: [
    DatePipe,
    NgIf,
  ],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.css'
})
export class CartItemComponent {
  @Input({required: true,}) title: string = '';
  @Input({required: true}) content: string = '';
  @Input() publishDate: Date = new Date();
  @Input() tags: string[] = [];
  @Input() isLast = false
  @Input({required: true}) id = 0 ;

  constructor(private router: Router) {
  }

  handleViewBlog(event: MouseEvent , id:number) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate([`/blog-list/${id}`]);
  }
}
