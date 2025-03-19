## Angular 父子组件通信方式

在 Angular 中，父子组件之间通信是构建复杂 UI 的关键部分。 Angular 提供了多种方式来实现这种通信，每种方式都有其适用的场景。 以下是 Angular 中父子组件通信的主要方式。

**1.  `@Input` 装饰器 (父 -> 子)**

*   **描述：** 这是最常见和最简单的父组件向子组件传递数据的方式。 父组件通过属性绑定将数据传递给子组件的 `@Input` 属性。
*   **语法：**

    ```typescript
    // 父组件 (parent.component.ts)
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-parent',
      template: `
        <app-child [message]="parentMessage"></app-child>
      `
    })
    export class ParentComponent {
      parentMessage = 'Hello from parent!';
    }

    // 子组件 (child.component.ts)
    import { Component, Input } from '@angular/core';

    @Component({
      selector: 'app-child',
      template: `
        <p>{{ message }}</p>
      `
    })
    export class ChildComponent {
      @Input() message: string; // 声明一个输入属性
    }
    ```

*   **特点：**
  *   简单易用：代码简洁，易于理解。
  *   单向数据流：数据只能从父组件流向子组件。
  *   类型安全：可以使用 TypeScript 类型来确保传递的数据类型正确。
*   **何时使用：** 当父组件需要向子组件传递静态或动态数据时，例如配置信息、初始状态等。

**2.  `@Output` 装饰器和 `EventEmitter` (子 -> 父)**

*   **描述：** 这是子组件向父组件传递数据的方式。 子组件通过创建一个 `EventEmitter` 实例并使用 `@Output` 装饰器将其暴露给父组件。 父组件监听这个事件，并执行相应的操作。
*   **语法：**

    ```typescript
    // 父组件 (parent.component.ts)
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-parent',
      template: `
        <app-child (messageEvent)="receiveMessage($event)"></app-child>
        <p>Message from child: {{ childMessage }}</p>
      `
    })
    export class ParentComponent {
      childMessage = '';

      receiveMessage(message: string) {
        this.childMessage = message;
      }
    }

    // 子组件 (child.component.ts)
    import { Component, Output, EventEmitter } from '@angular/core';

    @Component({
      selector: 'app-child',
      template: `
        <button (click)="sendMessage()">Send Message</button>
      `
    })
    export class ChildComponent {
      @Output() messageEvent = new EventEmitter<string>(); // 创建一个事件发射器

      sendMessage() {
        this.messageEvent.emit('Hello from child!'); // 触发事件，并传递数据
      }
    }
    ```

*   **特点：**
  *   事件驱动：基于事件的通信方式，更加灵活。
  *   单向数据流：数据只能从子组件流向父组件。
  *   解耦：父组件和子组件之间没有直接的依赖关系。
*   **何时使用：** 当子组件需要通知父组件发生了某个事件，或者需要向父组件传递数据时，例如按钮点击、表单提交等。

**3.  `@ViewChild` 装饰器 (父 -> 子)**

*   **描述：** 父组件可以使用 `@ViewChild` 装饰器来获取子组件的实例。 这样，父组件就可以直接调用子组件的方法，或访问子组件的属性。
*   **语法：**

    ```typescript
    // 父组件 (parent.component.ts)
    import { Component, AfterViewInit, ViewChild } from '@angular/core';
    import { ChildComponent } from './child.component';

    @Component({
      selector: 'app-parent',
      template: `
        <app-child></app-child>
        <button (click)="callChildMethod()">Call Child Method</button>
      `
    })
    export class ParentComponent implements AfterViewInit {
      @ViewChild(ChildComponent) child: ChildComponent; // 获取子组件的实例

      ngAfterViewInit() {
        // 确保子组件已经初始化
      }

      callChildMethod() {
        this.child.childMethod(); // 调用子组件的方法
      }
    }

    // 子组件 (child.component.ts)
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-child',
      template: `
        <p>Child Component</p>
      `
    })
    export class ChildComponent {
      childMethod() {
        console.log('Child method called!');
      }
    }
    ```

*   **特点：**
  *   直接访问：父组件可以直接访问子组件的成员。
  *   耦合性强：父组件和子组件之间有直接的依赖关系。
  *   不推荐：应谨慎使用，尽可能使用 `@Input` 和 `@Output` 来替代。
*   **何时使用：** 极少数特殊情况，例如需要直接操作子组件的 DOM 元素时。

**4.  Service (父 <-> 子)**

*   **描述：** 父组件和子组件可以共享一个服务，通过服务来进行通信。 服务可以包含共享的数据和方法，父组件和子组件都可以访问和修改这些数据和方法。
*   **语法：**

    ```typescript
    // data.service.ts
    import { Injectable } from '@angular/core';
    import { BehaviorSubject } from 'rxjs';

    @Injectable({
      providedIn: 'root'
    })
    export class DataService {
      private messageSource = new BehaviorSubject<string>('Default message');
      currentMessage = this.messageSource.asObservable();

      changeMessage(message: string) {
        this.messageSource.next(message);
      }
    }

    // 父组件 (parent.component.ts)
    import { Component, OnInit } from '@angular/core';
    import { DataService } from './data.service';

    @Component({
      selector: 'app-parent',
      template: `
        <p>Message from service: {{ message }}</p>
        <app-child></app-child>
      `
    })
    export class ParentComponent implements OnInit {
      message: string;

      constructor(private dataService: DataService) { }

      ngOnInit() {
        this.dataService.currentMessage.subscribe(message => this.message = message);
      }
    }

    // 子组件 (child.component.ts)
    import { Component } from '@angular/core';
    import { DataService } from './data.service';

    @Component({
      selector: 'app-child',
      template: `
        <button (click)="newMessage()">New Message</button>
      `
    })
    export class ChildComponent {
      constructor(private dataService: DataService) { }

      newMessage() {
        this.dataService.changeMessage('Hello from child!');
      }
    }
    ```

*   **特点：**
  *   灵活：可以实现父组件和子组件之间的双向通信。
  *   解耦：父组件和子组件之间没有直接的依赖关系。
  *   可维护性：易于维护和扩展。
*   **何时使用：** 当父组件和子组件需要共享大量数据，或者需要进行复杂的双向通信时。

**5. Signals (父 -> 子 和 子 -> 父)**
* **描述**: Signals 是 Angular 16 引入的一个响应式系统，可以用于组件之间的数据共享和通信。 对于父子组件通信，`@Input` 和 `@Output` 也可以结合 `signal` 来实现更细粒度的变更检测和响应。
* **语法**

```typescript
// 父组件 (parent.component.ts)
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-parent',
  template: `
    <app-child [message]="parentMessage"></app-child>
    <p>Message from child: {{ childMessage() }}</p>
  `
})
export class ParentComponent {
  parentMessage = signal('Hello from parent!');
  childMessage = signal('');

  handleChildMessage(message: string) {
    this.childMessage.set(message);
  }
}

// 子组件 (child.component.ts)
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';

@Component({
  selector: 'app-child',
  template: `
    <p>{{ message() }}</p>
    <button (click)="sendMessage()">Send Message</button>
  `
})
export class ChildComponent {
  @Input() message = signal('');
  @Output() messageEvent = new EventEmitter<string>();

  sendMessage() {
    this.messageEvent.emit('Hello from child!');
  }
}
```
* **特点**:
  * 可以利用 signals 提供的响应式能力，做到更细粒度的数据变更检测。
  * 结合 `@Input` 和 `@Output` 装饰器，可以很容易实现组件之间的双向数据绑定。
* **何时使用**: 适合对响应式有要求的场景。

**总结：**

| 通信方式                 | 方向       | 描述                                                                                                                                                             | 优点                                                                                           | 缺点                                                                                                                                                                         | 适用场景                                                                                                                                                    |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@Input`                 | 父 -> 子   | 父组件向子组件传递数据。                                                                                                                                          | 简单易用，类型安全。                                                                                      | 单向数据流。                                                                                                                                                                       | 父组件需要向子组件传递静态或动态数据时。                                                                                                                                |
| `@Output` 和 `EventEmitter` | 子 -> 父   | 子组件向父组件传递数据。                                                                                                                                          | 事件驱动，解耦。                                                                                                 | 单向数据流。                                                                                                                                                                       | 子组件需要通知父组件发生了某个事件，或者需要向父组件传递数据时。                                                                                                                    |
| `@ViewChild`              | 父 -> 子   | 父组件获取子组件的实例，并直接调用子组件的方法或访问子组件的属性。                                                                                                                      | 直接访问。                                                                                         | 耦合性强，不推荐使用。                                                                                                                                                              | 极少数特殊情况，例如需要直接操作子组件的 DOM 元素时。                                                                                                            |
| Service                 | 父 <-> 子 | 父组件和子组件共享一个服务，通过服务进行通信。                                                                                                                            | 灵活，解耦，可维护性高。                                                                                     | 无。                                                                                                                                                                             | 父组件和子组件需要共享大量数据，或者需要进行复杂的双向通信时。                                                                                                                  |
| Signals     | 父 <-> 子 | 使用信号来传递父子组件的数据。                                                                                                                            | 通过 signals 提供的响应式能力，做到更细粒度的数据变更检测。                                                                                     | 代码复杂度相对其他方式较高。                                                                                                                                                                             | 适合对响应式有要求的场景。                                                                                                                  |

**选择哪个方法：**

*   **首选 `@Input` 和 `@Output`：** 这是 Angular 中最常用和推荐的父子组件通信方式，因为它简单易用，并且符合单向数据流的原则。
*   **谨慎使用 `@ViewChild`：** 只有在确实需要直接操作子组件的 DOM 元素时，才应该考虑使用 `@ViewChild`。
*   **使用 Service 进行复杂通信：** 当父组件和子组件之间需要共享大量数据，或者需要进行复杂的双向通信时，可以使用 Service。
*   **使用 Signals 实现更加灵活的通信** 在需要精确控制响应式时，可考虑选择 Signals

总之，选择哪种通信方式取决于你的具体需求和组件之间的关系。  尽量选择能够保持组件解耦和可测试性的方法。
