---
layout: markdown
title:  什么是 Dependency Injection?
date:   2025-03-20 13:39:39 +0800
categories: update
---
{% raw %}

Dependency Injection (DI)，中文译为“依赖注入”，是一种软件设计模式，也是面向对象编程中的一种常用技术。它的核心思想是**将组件（或对象）的依赖关系从组件内部移除，转而通过外部“注入”的方式提供给组件。**

**理解依赖：**

首先，要理解什么是“依赖”。  在软件开发中，一个组件（比如一个类、一个函数）如果需要使用另一个组件，我们就说它依赖于另一个组件。

例如：

```typescript
// MailService 类 (依赖项)
class MailService {
  sendEmail(to: string, message: string) {
    console.log(`Sending email to ${to}: ${message}`);
  }
}

// UserService 类 (依赖于 MailService)
class UserService {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();  // UserService 直接创建 MailService 的实例
  }

  createUser(email: string) {
    // 创建用户，并发送欢迎邮件
    console.log(`Creating user with email: ${email}`);
    this.mailService.sendEmail(email, 'Welcome to our platform!');
  }
}

const userService = new UserService();
userService.createUser('test@example.com');
```

在这个例子中，`UserService` 依赖于 `MailService`，因为它需要 `MailService` 来发送邮件。 问题在于，`UserService` 直接创建了 `MailService` 的实例，这意味着：

*   **紧耦合:** `UserService` 和 `MailService` 紧密耦合在一起。  如果 `MailService` 的实现发生变化，`UserService` 也需要修改。
*   **难以测试:** 很难对 `UserService` 进行单元测试，因为测试需要涉及到 `MailService` 的行为。  无法轻松地使用 mock 或 stub 替换 `MailService`。
*   **难以重用:**  `UserService` 只能使用特定的 `MailService` 实现。  如果需要使用不同的邮件服务，则需要修改 `UserService` 的代码。

**Dependency Injection 的解决方案：**

Dependency Injection 通过以下方式解决了上述问题：

1.  **不让组件自己创建依赖，而是从外部接收依赖。**
2.  **定义一个“注入器”（Injector），负责创建和管理依赖，并将它们注入到需要的组件中。**

使用 Dependency Injection 的 TypeScript 代码示例：

```typescript
// MailService 类 (依赖项)
class MailService {
  sendEmail(to: string, message: string) {
    console.log(`Sending email to ${to}: ${message}`);
  }
}

// UserService 类 (依赖于 MailService)
class UserService {
  private mailService: MailService;

  constructor(mailService: MailService) {  // 依赖通过构造函数注入
    this.mailService = mailService;
  }

  createUser(email: string) {
    // 创建用户，并发送欢迎邮件
    console.log(`Creating user with email: ${email}`);
    this.mailService.sendEmail(email, 'Welcome to our platform!');
  }
}

// 创建 MailService 实例
const mailService = new MailService();

// 创建 UserService 实例，并将 MailService 实例注入
const userService = new UserService(mailService);

userService.createUser('test@example.com');
```

在这个例子中：

*   `UserService` 的构造函数现在接收一个 `MailService` 实例作为参数。  `UserService` 不再负责创建 `MailService` 的实例。
*   `mailService` 实例在 `UserService` 外部创建，并作为参数传递给 `UserService` 的构造函数。

**好处：**

*   **松耦合:** `UserService` 不再直接依赖于 `MailService` 的特定实现，而是依赖于一个抽象的 `MailService` 接口（虽然在这个例子中没有明确的接口，但可以很容易地添加一个）。  这使得更改 `MailService` 的实现变得更加容易，而无需修改 `UserService` 的代码。
*   **易于测试:** 可以很容易地使用 mock 或 stub 替换 `MailService`，从而对 `UserService` 进行单元测试。
*   **易于重用:** `UserService` 可以使用不同的 `MailService` 实现，只要它们符合 `MailService` 的接口。

**Angular 中的 Dependency Injection**

Angular 框架内置了强大的依赖注入系统。它使用 TypeScript 的类型信息和装饰器来实现依赖注入。

```typescript
// mail.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'  // 声明为 root 级别的 provider，可以在整个应用中使用
})
export class MailService {
  sendEmail(to: string, message: string) {
    console.log(`Sending email to ${to}: ${message}`);
  }
}

// user.service.ts
import { Injectable } from '@angular/core';
import { MailService } from './mail.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private mailService: MailService) {}  // 构造函数注入

  createUser(email: string) {
    console.log(`Creating user with email: ${email}`);
    this.mailService.sendEmail(email, 'Welcome to our platform!');
  }
}

// app.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="createUser()">Create User</button>
  `,
})
export class AppComponent implements OnInit {
  constructor(private userService: UserService) {}

  ngOnInit() {
    // Angular 会自动创建 UserService 和 MailService 的实例，并将 MailService 注入到 UserService 中。
  }

  createUser() {
    this.userService.createUser('test@example.com');
  }
}
```

在这个 Angular 例子中：

*   `@Injectable()` 装饰器告诉 Angular 这个类可以被注入到其他类中。
*   `providedIn: 'root'`  表示该服务在根级别提供，这意味着它在整个应用中只有一个实例。
*   `UserService` 的构造函数使用 `private mailService: MailService` 请求注入 `MailService`。  Angular 会自动创建 `MailService` 的实例，并将它注入到 `UserService` 中。

**总结：**

Dependency Injection 是一种强大的设计模式，它可以提高代码的灵活性、可测试性和可重用性。 在 Angular 中，依赖注入是框架的核心特性之一，它简化了应用程序的开发和维护。 核心概念是：**不要让组件自己创建依赖，而是通过外部注入的方式提供依赖。**
{% endraw %}