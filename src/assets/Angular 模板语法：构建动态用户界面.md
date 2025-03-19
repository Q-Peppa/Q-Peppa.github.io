## Angular 模板语法：构建动态用户界面

Angular 模板语法是构建动态 Angular 应用的基石。它允许你将组件中的数据高效且清晰地呈现到视图中。本文将探讨 Angular 模板语法的核心概念，并结合 `title: string`, `id: number`, `content: string`, `publishDate: Date`, `tags: string[]` 这些常见的数据结构，演示如何在模板中巧妙地运用它们。

### 1. 数据准备

首先，我们创建一个 Angular 组件，并在其中定义一些属性，模拟从后端获取的数据：

```typescript
// article.component.ts
import {Component} from '@angular/core';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent {
  title: string = 'Angular 模板语法详解';
  id: number = 123;
  content: string = `Angular 模板语法允许开发者将组件的数据绑定到视图中，实现动态更新...`;
  publishDate: Date = new Date(2024, 10, 27); // 注意：月份从 0 开始
  tags: string[] = ['Angular', '模板', '前端开发'];
}
```

### 2. 插值表达式：{{ }}

插值表达式是最简单的模板语法，用于将组件的属性值直接嵌入到  中。

```html
<h1>{{ title }}</h1>
<p>文章 ID: {{ id }}</p>
<p>{{ content }}</p>
<p>发布日期: {{ publishDate }}</p> <!-- 默认的日期格式，可能需要格式化 -->
```

插值表达式会将 `title`, `id`, 和 `content` 的值直接渲染到页面上。对于 `publishDate`，`Angular` 会自动将其转换为字符串。

### 3. 属性绑定：[]

属性绑定用于将组件的属性值绑定到  元素的属性。 这比直接在字符串中使用插值更安全，尤其是在设置 src 或 href 等属性时，可以防止 XSS 攻击。

```html
<!-- article.component. -->
<a [href]="'articles/' + id">阅读更多</a>
<img [src]="'assets/images/article-' + id + '.jpg'" [alt]="title">
```

### 4. 事件绑定：()

```html
<!-- article.component. -->
<button (click)="shareArticle()">分享</button>
```

```typescript

// article.component.ts
import {Component} from '@angular/core';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent {
  title: string = 'Angular 模板语法详解';
  id: number = 123;
  content: string = `Angular 模板语法允许开发者将组件的数据绑定到视图中，实现动态更新...`;
  publishDate: Date = new Date(2024, 10, 27); // 注意：月份从 0 开始
  tags: string[] = ['Angular', '模板', '前端开发'];

  shareArticle() {
    alert(`分享文章: ${this.title}`);
  }
}

```

当点击 "分享" 按钮时，shareArticle() 方法会被调用。

### 5. 双向数据绑定：[()]

双向数据绑定允许你在组件属性和表单元素之间建立双向的数据流。 使用 `[(ngModel)]`指令实现。 需要 `FormsModule`。

```html
<!-- article.component. -->
<input type="text" [(ngModel)]="comment">
<p>评论：{{ comment }}</p>
```

```typescript

// article.component.ts
import {Component} from '@angular/core';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent {
  title: string = 'Angular 模板语法详解';
  id: number = 123;
  content: string = `Angular 模板语法允许开发者将组件的数据绑定到视图中，实现动态更新...`;
  publishDate: Date = new Date(2024, 10, 27); // 注意：月份从 0 开始
  tags: string[] = ['Angular', '模板', '前端开发'];
  comment: string = '';
}

```

在输入框中输入内容时，`comment` 属性的值会自动更新，反之亦然。

### 6. 结构指令：*ngIf, *ngFor, *ngSwitch

结构指令用于改变 `DOM` 的结构，可以根据条件渲染元素、循环渲染元素列表，或根据不同的条件渲染不同的元素。

> *_ngIf_

```html
 <!-- article.component. -->
<div *ngIf="tags.length > 0">
  <h3>标签：</h3>
  <ul>
    <li *ngFor="let tag of tags">{{ tag }}</li>
  </ul>
</div>
```

> *_ngFor_

```html
<!-- article.component. -->
<ul>
  <li *ngFor="let tag of tags; let i = index; let isEven = even">
    {{ i + 1 }}. {{ tag }} ({{ isEven ? '偶数' : '奇数' }})
  </li>
</ul>

```
循环遍历 `tags` 数组，并为每个标签创建一个 `li` 元素。 `index` 变量表示当前元素的索引，`even` 变量表示当前元素的索引是否为偶数。

> *_ngSwitch_

```html
<!-- article.component. -->
<div [ngSwitch]="category">
  <div *ngSwitchCase="'angular'">Angular 文章</div>
  <div *ngSwitchCase="'javascript'">JavaScript 文章</div>
  <div *ngSwitchDefault>通用文章</div>
</div>

```
根据 `category` 变量的值，渲染不同的 `div` 元素。



### 7. 管道 (Pipes)
管道用于转换数据，以便在模板中显示。Angular 提供了很多内置管道，也可以自定义管道。


- date 管道: 用于格式化日期
```html
<!-- article.component. -->
<p>发布日期: {{ publishDate | date:'yyyy-MM-dd HH:mm' }}</p>
```
- uppercase 和 lowercase 管道: 用于转换字符串的大小写。
```html
<!-- article.component. -->
<h1>{{ title | uppercase }}</h1>
<p>{{ content | lowercase }}</p>
```
- slice 管道: 用于截取字符串或数组。
```html
<!-- article.component. -->
<p>{{ content | slice:0:100 }}...</p> <!-- 截取 content 的前 100 个字符 -->

```

### 8. 模板引用变量 (#)
模板引用变量允许你在模板中引用  元素或组件实例。
```html
<!-- article.component. -->
<input type="text" #commentInput>
<button (click)="addComment(commentInput.value)">添加评论</button>

```

```typescript
// article.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent {
  addComment(comment: string) {
    alert(`添加评论: ${comment}`);
  }
}

```
`#commentInput` 创建了一个模板引用变量，指向该 `input` 元素。 在 `addComment()` 方法中，我们可以通过 `commentInput.value` 获取输入框的值。

