import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FooterComponent} from './core/footer/footer.component';
import {DOCUMENT} from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  {
  title = 'Angular学习';
  document = inject(DOCUMENT)
  constructor() {
    this.document.title = this.title;
  }
}
