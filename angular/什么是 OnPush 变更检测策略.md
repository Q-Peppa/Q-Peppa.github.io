---
parent: Angular
title:  Angular 什么是 OnPush 变更检测策略
categories: Angular
nav_order: 1
render_with_liquid: false
---

`OnPush` 是 Angular 中的一种变更检测策略（Change Detection Strategy），用于优化应用程序的性能。通过使用 `OnPush` 策略，Angular 可以减少不必要的变更检测，从而提高应用的响应速度和效率。以下是对 `OnPush` 的详细介绍、使用方法以及优化建议。

## 什么是 `OnPush` 变更检测策略？

在 Angular 中，默认的变更检测策略是 `Default`，这意味着 Angular 会定期检查每个组件及其子组件的绑定和状态，以确定它们是否需要更新。这种频繁的检查可能会导致性能瓶颈，特别是在复杂的大型应用中。

`OnPush` 变更检测策略通过限制变更检测的范围来优化性能。具体来说，当一个组件使用 `OnPush` 策略时，Angular 仅在以下几种情况下进行变更检测：

1. **输入属性 (`@Input`) 发生引用变化**：即 `@Input` 的引用发生变化（如对象或数组的引用变化）。
2. **事件冒泡到该组件**：如 click 事件、keyup 事件等。
3. **手动触发变更检测**：通过 `ChangeDetectorRef` 手动触发。

通过这种方式，Angular 可以减少不必要的变更检测，从而提高应用性能。

## 使用 `OnPush` 策略的优点

1. **提高性能**：减少不必要的变更检测，特别是在大型应用中。
2. **减少内存消耗**：由于变更检测的频率降低，内存消耗也会相应减少。
3. **简化组件逻辑**：明确组件的响应条件，使组件逻辑更加清晰和可维护。
4. **更好的响应速度**：用户界面的更新更加迅速，提升用户体验。

## 如何在 Angular 组件中使用 `OnPush`？

要在 Angular 组件中使用 `OnPush` 变更检测策略，可以通过以下步骤实现：

### 1. 导入 `ChangeDetectionStrategy`

首先，从 `@angular/core` 中导入 `ChangeDetectionStrategy`。

```typescript
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
```

### 2. 设置组件的 `changeDetection` 属性

在组件的装饰器中，设置 `changeDetection` 属性为 `ChangeDetectionStrategy.OnPush`。

```typescript
@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  @Input() data: any;

  constructor() {}
}
```

### 3. 确保输入属性使用不可变对象

为了充分利用 `OnPush` 的优势，输入属性应该尽量使用不可变对象（immutable objects）。不可变对象是指一旦创建，其状态就不能被修改的对象。常见的不可变对象包括：

- **原始类型**：`string`, `number`, `boolean`, `null`, `undefined`, `symbol`。
- **冻结的对象**：使用 `Object.freeze` 冻结的对象。
- **不可变数据结构库**：如 Immutable.js。

#### 示例：使用不可变对象

```typescript
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: `
    <div>{{ item.name }} - {{ item.value }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  @Input() item: { name: string; value: number };

  constructor() {}
}
```

#### 避免直接修改输入属性

```typescript
// 不推荐的做法 - 直接修改输入属性
this.item.name = 'New Name'; // 这不会触发变更检测

// 推荐的做法 - 使用新对象
this.item = { ...this.item, name: 'New Name' }; // 这会触发变更检测
```

### 4. 手动触发变更检测（可选）

在某些情况下，你可能需要手动触发变更检测。可以通过注入 `ChangeDetectorRef` 并调用其方法来实现。

```typescript
import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: `
    <div>{{ item.name }} - {{ item.value }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  @Input() item: { name: string; value: number };

  constructor(private cdr: ChangeDetectorRef) {}

  updateItem() {
    // 更新数据
    this.item = { ...this.item, name: 'New Name' };
    // 手动触发变更检测
    this.cdr.detectChanges();
  }
}
```

### 5. 注意事项

- **避免使用共享的可变对象**：共享的可变对象可能会导致变更检测失效。

  ```typescript
  // 不推荐的做法 - 共享可变对象
  @Input() sharedData: { name: string };

  constructor(private service: DataService) {
    this.sharedData = service.getSharedData(); // 可能会导致变更检测失效
  }
  ```

- **调试 `OnPush` 变更检测**：由于 `OnPush` 的变更检测范围有限，调试过程中可能会遇到一些问题。可以使用 `ngOnChanges` 钩子来调试输入属性的变化。

  ```typescript
  import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';

  @Component({
    selector: 'app-my-component',
    template: `
      <div>{{ item.name }} - {{ item.value }}</div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
  })
  export class MyComponent implements OnChanges {
    @Input() item: { name: string; value: number };

    ngOnChanges(changes: SimpleChanges) {
      console.log('Changes', changes);
    }
  }
  ```

## 使用 `OnPush` 的最佳实践

1. **优先使用不可变对象**：
   - 使用不可变数据结构库如 Immutable.js，或使用 JavaScript 的 `Object.freeze`。
   - 避免直接修改输入属性，始终创建新对象来更新数据。

2. **合理设置 `OnPush` 策略**：
   - 对于性能敏感的组件，使用 `OnPush`。
   - 对于频繁更新的小组件，保持默认的 `Default` 策略，以确保其响应性。

3. **使用 `ngOnChanges` 钩子**：
   - 利用 `ngOnChanges` 钩子来调试和处理输入属性的变化。
   - 在 `ngOnChanges` 中可以执行一些必要的逻辑，如根据输入属性的变化更新本地状态。

4. **避免依赖注入服务**：
   - 如果组件依赖注入的服务可能会频繁变化，使用 `OnPush` 可能导致变更检测失效。
   - 考虑使用 `async` 管道和 `Observables` 来处理异步数据。

5. **结合使用 `RxJS`**：
   - 使用 `RxJS` 和 `Observables` 来管理组件的状态和数据流，可以更好地与 `OnPush` 策略结合使用。

## 示例代码

以下是一个完整的示例，展示了如何在 Angular 组件中使用 `OnPush` 变更检测策略，并确保输入属性使用不可变对象。

### 父组件

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>使用 OnPush 策略的示例</h1>
      <app-my-component [item]="item"></app-my-component>
      <button (click)="updateItem()">Update Item</button>
    </div>
  `
})
export class AppComponent {
  item = { name: 'Initial Name', value: 100 };

  updateItem() {
    this.item = { ...this.item, name: 'Updated Name' };
  }
}
```

### 子组件（使用 `OnPush`）

```typescript
// my-component.component.ts
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: `
    <div>{{ item.name }} - {{ item.value }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  @Input() item: { name: string; value: number };

  constructor() {}
}
```

### 子组件模板

```hbs
<div>
  {{ item.name }} - {{ item.value }}
</div>
```

在这个示例中，当点击按钮更新 `item` 时，父组件会使用新对象来更新 `item` 的引用。由于子组件使用 `OnPush` 变更检测策略，Angular 会检测到 `item` 的引用变化并重新渲染子组件。

## 总结

`OnPush` 变更检测策略是 Angular 中一种强大的性能优化工具，通过限制变更检测的范围，显著提高应用的性能和响应速度。要充分利用 `OnPush` 的优势，需要确保输入属性使用不可变对象，并合理设置变更检测策略。

通过上述步骤和最佳实践，你可以在 Angular 应用中成功地使用 `OnPush` 变更检测策略，从而提升应用的整体性能。
