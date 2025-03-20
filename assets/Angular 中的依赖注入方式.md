## Angular 中的依赖注入方式

在 Angular 中，依赖注入 (DI) 是一种核心机制，用于管理组件和服务的依赖关系。 Angular 提供了多种注入依赖的方式.

**1. 构造函数注入 (Constructor Injection)**

*   **描述：** 这是最常见、最推荐的依赖注入方式。 通过在组件、指令或服务的构造函数中声明参数，来请求 Angular 注入依赖。
*   **语法：**

    ```typescript
    import { Component, OnInit } from '@angular/core';
    import { MyService } from './my.service';

    @Component({
      selector: 'app-my-component',
      templateUrl: './my-component.component.html',
      styleUrls: ['./my-component.component.css']
    })
    export class MyComponent implements OnInit {
      constructor(private myService: MyService) { } // 构造函数注入

      ngOnInit(): void {
        this.myService.doSomething();
      }
    }
    ```

*   **特点：**
  *   清晰：明确地声明了组件的依赖关系。
  *   易于测试：可以通过构造函数参数传入 mock 对象进行单元测试。
  *   推荐方式：Angular 团队推荐使用构造函数注入。
  *   类型安全：TypeScript 的类型检查可以确保传入正确的依赖类型。
*   **何时使用：** 绝大多数情况下，都应该使用构造函数注入。

**2. 属性注入 (Property Injection / Field Injection)**

*   **描述：** 通过在类属性上使用 `@Inject` 装饰器来注入依赖。
*   **语法：**

    ```typescript
    import { Component, Inject, OnInit } from '@angular/core';
    import { MyService } from './my.service';

    @Component({
      selector: 'app-my-component',
      templateUrl: './my-component.component.html',
      styleUrls: ['./my-component.component.css']
    })
    export class MyComponent implements OnInit {
      @Inject(MyService) private myService: MyService; // 属性注入

      ngOnInit(): void {
        this.myService.doSomething();
      }
    }
    ```

*   **特点：**
  *   简洁：代码量较少。
  *   不推荐：相比于构造函数注入，属性注入不太清晰，更难于测试，可能导致循环依赖。
  *   必须配合 `@Inject` 装饰器使用，用于告知 Angular 注入哪个依赖。
*   **何时使用：** 极少数特殊情况，例如当使用第三方库，并且无法修改构造函数时，可以考虑使用属性注入。 强烈不推荐在常规 Angular 开发中使用。

**3. Setter 注入 (Setter Injection)**

*   **描述：** 通过在类的 setter 方法上使用 `@Inject` 装饰器来注入依赖。
*   **语法：**

    ```typescript
    import { Component, Inject, OnInit } from '@angular/core';
    import { MyService } from './my.service';

    @Component({
      selector: 'app-my-component',
      templateUrl: './my-component.component.html',
      styleUrls: ['./my-component.component.css']
    })
    export class MyComponent implements OnInit {
      private _myService: MyService;

      @Inject(MyService)
      set myService(service: MyService) { // Setter 注入
        this._myService = service;
      }

      ngOnInit(): void {
        this._myService.doSomething();
      }
    }
    ```

*   **特点：**
  *   允许延迟注入：依赖可以在对象创建后注入。
  *   不常见：通常没有特别的优势，不如构造函数注入清晰。
  *   必须配合 `@Inject` 装饰器使用。
*   **何时使用：** 极少数特殊情况，例如当需要可选的依赖时，可以考虑使用 setter 注入。 但这种情况更推荐使用构造函数注入，并允许依赖为 `null` 或 `undefined`。

**4.  `@Optional` 装饰器**

*   **描述：**  `@Optional` 不是一种独立的注入方式，而是一个与构造函数注入结合使用的装饰器。  它用于标记构造函数参数为可选依赖。
*   **语法：**

    ```typescript
    import { Component, OnInit, Optional } from '@angular/core';
    import { MyOptionalService } from './my-optional.service';

    @Component({
      selector: 'app-my-component',
      templateUrl: './my-component.component.html',
      styleUrls: ['./my-component.component.css']
    })
    export class MyComponent implements OnInit {
      constructor(@Optional() private myOptionalService?: MyOptionalService) { }

      ngOnInit(): void {
        if (this.myOptionalService) {
          this.myOptionalService.doSomething();
        } else {
          console.log('Optional service is not available.');
        }
      }
    }
    ```

*   **特点：**
  *   允许依赖不存在：如果依赖没有被提供，Angular 不会抛出错误，而是将构造函数参数设置为 `null` 或 `undefined`。
  *   增强了灵活性：可以创建在某些环境中可用，而在其他环境中不可用的组件或服务。
*   **何时使用：** 当依赖是可选的时候，例如某个功能只在特定模块中启用时。

**5. `useFactory` Provider**

* **描述：** 使用工厂函数来创建依赖实例。 允许更灵活的依赖创建逻辑，例如根据不同的条件创建不同的实例，或者使用其他的依赖来创建实例。
* **语法：**

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { MyService } from './my.service';

export function myServiceFactory(useValue: boolean) {
  return useValue ? new MyService('Value 1') : new MyService('Value 2');
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    {
      provide: MyService,
      useFactory: myServiceFactory,
      deps: ['useValue']  // 'useValue' 是一个注入令牌 (InjectionToken)，用于传递条件
    },
    {
      provide: 'useValue',  // 定义一个注入令牌
      useValue: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// my.service.ts
import { Injectable } from '@angular/core';

@Injectable()
export class MyService {
  constructor(public value: string) { }

  doSomething(): void {
    console.log('MyService is doing something with value: ' + this.value);
  }
}

// app.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MyService } from './my.service';

@Component({
  selector: 'app-root',
  template: `
    <p>Value from MyService: {{ myService.value }}</p>
  `
})
export class AppComponent implements OnInit {
  constructor(public myService: MyService) { }

  ngOnInit(): void {
    this.myService.doSomething();
  }
}

```

*   **特点:**
  *   灵活：可以根据不同的条件创建不同的依赖实例。
  *   复杂：需要编写工厂函数。
  *   需要指定 `deps`：`deps` 数组指定了工厂函数所需的依赖。
*   **何时使用：** 当需要复杂的依赖创建逻辑时，例如根据配置动态选择依赖。

**6.  `useClass` Provider**

*   **描述：** 使用指定的类来创建依赖实例。 可以用于替换默认的依赖实现。
*   **语法：**

    ```typescript
    // app.module.ts
    import { NgModule } from '@angular/core';
    import { BrowserModule } from '@angular/platform-browser';
    import { AppComponent } from './app.component';
    import { MyService } from './my.service';
    import { MockMyService } from './mock-my.service';

    @NgModule({
      declarations: [AppComponent],
      imports: [BrowserModule],
      providers: [
        {
          provide: MyService,
          useClass: MockMyService // 使用 MockMyService 替换 MyService
        }
      ],
      bootstrap: [AppComponent]
    })
    export class AppModule { }

    // my.service.ts
    import { Injectable } from '@angular/core';

    @Injectable()
    export class MyService {
      doSomething(): void {
        console.log('MyService is doing something.');
      }
    }

    // mock-my.service.ts
    import { Injectable } from '@angular/core';
    import { MyService } from './my.service';

    @Injectable()
    export class MockMyService extends MyService {
      override doSomething(): void {
        console.log('MockMyService is doing something.');
      }
    }
    ```

*   **特点：**
  *   简单：易于替换依赖实现。
  *   适用于测试：可以使用 Mock 对象替换真实的服务。
*   **何时使用：** 当需要替换依赖的默认实现时，例如在开发阶段使用 Mock 对象，或者在不同的环境中使用不同的实现。

**7.  `useValue` Provider**

*   **描述：** 使用一个静态的值作为依赖。
*   **语法：**

    ```typescript
    // app.module.ts
    import { NgModule } from '@angular/core';
    import { BrowserModule } from '@angular/platform-browser';
    import { AppComponent } from './app.component';
    import { API_URL } from './app.tokens'; // 使用 InjectionToken

    @NgModule({
      declarations: [AppComponent],
      imports: [BrowserModule],
      providers: [
        {
          provide: API_URL,
          useValue: 'https://api.example.com' // 提供 API_URL 的值
        }
      ],
      bootstrap: [AppComponent]
    })
    export class AppModule { }

    // app.tokens.ts
    import { InjectionToken } from '@angular/core';

    export const API_URL = new InjectionToken<string>('API_URL');

    // app.component.ts
    import { Component, Inject } from '@angular/core';
    import { API_URL } from './app.tokens';

    @Component({
      selector: 'app-root',
      template: `
        <p>API URL: {{ apiUrl }}</p>
      `
    })
    export class AppComponent {
      constructor(@Inject(API_URL) public apiUrl: string) { }
    }
    ```

*   **特点：**
  *   简单：易于提供静态配置值。
  *   适用于配置：可以用于提供 API 地址、主题颜色等配置信息。
  *   使用 `InjectionToken`：建议配合 `InjectionToken` 使用，以避免命名冲突。
*   **何时使用：** 当需要提供静态配置值时。

**总结：**

| 注入方式           | 描述                                                                                                                                                             | 优点                                                                          | 缺点                                                                                                                                                                                           | 适用场景                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 构造函数注入         | 通过构造函数参数声明依赖。                                                                                                                                          | 清晰、易于测试、推荐                                                                  | 无                                                                                                                                                                                             | 绝大多数情况。                                                                                                                            |
| 属性注入           | 通过 `@Inject` 装饰器在属性上注入依赖。                                                                                                                                | 简洁                                                                          | 不清晰、难于测试、可能导致循环依赖， **不推荐**                                                                                                                                                           | 极少数特殊情况，例如无法修改构造函数时。                                                                                                                              |
| Setter 注入         | 通过 `@Inject` 装饰器在 Setter 方法上注入依赖。                                                                                                                               | 允许延迟注入                                                                    | 不常见，不如构造函数注入清晰                                                                                                                                                                         | 极少数特殊情况，例如需要可选的依赖时。                                                                                                                            |
| `@Optional`       | 与构造函数注入结合使用，标记依赖为可选。                                                                                                                                         | 允许依赖不存在                                                                    | 需要检查依赖是否为 `null` 或 `undefined`。                                                                                                                                                             | 依赖是可选的时候。                                                                                                                              |
| `useFactory`      | 使用工厂函数创建依赖实例。                                                                                                                                          | 灵活，可以根据条件创建不同的实例。                                                               | 复杂，需要编写工厂函数，需要指定 `deps`。                                                                                                                                                              | 需要复杂的依赖创建逻辑时。                                                                                                                               |
| `useClass`        | 使用指定的类来创建依赖实例。                                                                                                                                          | 简单，易于替换依赖实现。                                                               | 需要创建新的类。                                                                                                                                                                               | 需要替换依赖的默认实现时，例如在开发阶段使用 Mock 对象。                                                                                                                  |
| `useValue`        | 使用一个静态的值作为依赖。                                                                                                                                          | 简单，易于提供静态配置值。                                                               | 只能提供静态值。                                                                                                                                                                             | 需要提供静态配置值时。                                                                                                                                |

**最佳实践：**

*   始终优先使用构造函数注入。
*   避免使用属性注入和 Setter 注入。
*   使用 `@Optional` 装饰器处理可选依赖。
*   使用 `useFactory`、`useClass` 和 `useValue` Provider 来灵活地配置依赖。
*   使用 `InjectionToken` 来定义依赖的标识符，避免命名冲突。

这个 Markdown 文档提供了 Angular 中依赖注入的各种方式的详细说明，并强调了最佳实践，帮助你编写更清晰、可维护和可测试的 Angular 代码。
