---
parent: Angular
title:  新控制流语法结合 Async 管道：优雅处理异步数据
last_modified_date:   2025-03-20 13:39:39 +0800
categories: update
---

{% raw %}
Angular 新的控制流语法（`@if`, `@for`, `@switch`）与 Async 管道结合使用，可以优雅地处理异步数据流，简化模板代码并提高可读性。 本文将介绍如何将两者结合使用，并展示其带来的好处。

### Async 管道简介

Async 管道（`async`）是一个 Angular 内置的管道，用于自动订阅 `Observable` 或 `Promise`，并将最新的值解包到模板中。 当组件销毁时，Async 管道会自动取消订阅，避免内存泄漏。

**使用 Async 管道的示例：**

```typescript
import { Component } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-async-example',
  templateUrl: './async-example.component.html',
  styleUrls: ['./async-example.component.css']
})
export class AsyncExampleComponent {
  time$: Observable<Date> = interval(1000).pipe(map(() => new Date()));
}
```

```html
<p>Current time: {{ time$ | async | date:'mediumTime' }}</p>
```

在这个例子中，`time$` 是一个 `Observable<Date>`，Async 管道自动订阅 `time$`，并在每次发出新值时更新模板。

### 新的控制流语法与 Async 管道的结合

将新的控制流语法与 Async 管道结合使用，可以更清晰、更简洁地处理异步数据。

**1. `@if` 和 Async 管道:**

```typescript
import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-async-if',
  templateUrl: './async-if.component.html',
  styleUrls: ['./async-if.component.css']
})
export class AsyncIfComponent {
  isLoading$: Observable<boolean> = of(true).pipe(delay(2000)); // 模拟异步加载
  data$: Observable<string> = of('Data loaded successfully!').pipe(delay(2000));
}
```

**旧语法：**

```html
<div *ngIf="isLoading$ | async; else loaded">
  Loading...
</div>
<ng-template #loaded>
  <div>
    {{ data$ | async }}
  </div>
</ng-template>
```

**新语法：**

```html
@if (isLoading$ | async) {
  <div>Loading...</div>
} @else {
  @if (data$ | async; as data) {
    <div>{{ data }}</div>
  } @else {
     <div>Error loading data.</div>
  }
}
```

**代码解释：**

*   `isLoading$ | async`：Async 管道订阅 `isLoading$` Observable，并将其最新的值（true 或 false）传递给 `@if` 语句。
*   `data$ | async; as data`:  这里使用了`as` 关键字，将`data$ | async`的结果赋值给变量`data`，方便在模板中引用。如果`data$`为null或者undefined, `@if`语句块不执行。
*   新语法避免了使用 `<ng-template>`，使代码更易读。

**2. `@for` 和 Async 管道:**

```typescript
import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-async-for',
  templateUrl: './async-for.component.html',
  styleUrls: ['./async-for.component.css']
})
export class AsyncForComponent {
  items$: Observable<string[]> = of(['Item 1', 'Item 2', 'Item 3']).pipe(delay(1000)); // 模拟异步数据
}
```

**旧语法：**

```html
<ul>
  <li *ngFor="let item of items$ | async">{{ item }}</li>
</ul>
```

**新语法：**

```html
<ul>
  @for (item of items$ | async; track item) {
    <li>{{ item }}</li>
  } @empty {
    <li>No items found.</li>
  }
</ul>
```

**代码解释：**

*   `items$ | async`：Async 管道订阅 `items$` Observable，并将其最新的值（一个字符串数组）传递给 `@for` 循环。
*   `@empty`：当 `items$` Observable 发出的数组为空时，显示 "No items found."。
*   使用新的语法，可以更清晰地表达异步数据的循环逻辑，并且利用`@empty`处理空数组的情况。

**3. `@switch` 和 Async 管道:**

```typescript
import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-async-switch',
  templateUrl: './async-switch.component.html',
  styleUrls: ['./async-switch.component.css']
})
export class AsyncSwitchComponent {
  status$: Observable<string> = of('loading').pipe(delay(1000)); // 模拟异步状态
}
```

**旧语法：**

```html
<div [ngSwitch]="status$ | async">
  <div *ngSwitchCase="'loading'">Loading...</div>
  <div *ngSwitchCase="'success'">Success!</div>
  <div *ngSwitchCase="'error'">Error!</div>
  <div *ngSwitchDefault>Unknown status</div>
</div>
```

**新语法：**

```html
@switch (status$ | async) {
  @case ('loading') {
    <div>Loading...</div>
  }
  @case ('success') {
    <div>Success!</div>
  }
  @case ('error') {
    <div>Error!</div>
  }
  @default {
    <div>Unknown status</div>
  }
}
```

**代码解释：**

*   `status$ | async`：Async 管道订阅 `status$` Observable，并将其最新的值（一个字符串）传递给 `@switch` 语句。
*  新语法简化了 switch 语句的编写，使其更易于阅读和理解。

### 优势

*   **简洁性：**  新的控制流语法结合 Async 管道，可以更简洁地表达异步数据流的逻辑。
*   **可读性：**  新的语法更易于阅读和理解，降低了代码维护的难度。
*   **类型安全：**  Angular 编译器可以对新的语法进行更严格的类型检查，减少运行时错误。
*   **避免内存泄漏：**  Async 管道自动处理 Observable 的订阅和取消订阅，避免内存泄漏。
*   **优雅处理 loading 状态和错误状态：** 可以方便地使用 `@if`, `@for`, 和 `@switch` 语句来处理异步数据的 loading 状态和错误状态，提高用户体验。

### 总结

Angular 新的控制流语法与 Async 管道结合使用，为处理异步数据提供了一种更优雅、更高效的方式。 它们可以简化模板代码，提高可读性，并减少运行时错误。 强烈建议在 Angular 项目中使用这种组合，以构建更健壮、更易于维护的应用程序。 通过掌握这些技术，你可以更轻松地处理复杂的异步场景，并为用户提供更好的体验。
{% endraw %}