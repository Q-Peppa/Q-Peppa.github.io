---
parent: Angular
title: Angular 响应式表单：构建复杂的表单应用
---


Angular 的响应式表单提供了一种更加灵活和可测试的方式来处理表单，特别是在构建复杂的表单应用程序时。它允许你在 TypeScript 代码中定义表单结构，而不是依赖模板。 这篇文章将深入探讨 Angular 响应式表单的概念、优势以及如何构建一个复杂的表单应用。

### 为什么选择响应式表单？

相较于模板驱动表单，响应式表单具有以下优势：

- **可测试性：** 表单结构在代码中定义，更容易进行单元测试。
- **类型安全：** 使用 TypeScript 确保表单值的类型安全。
- **灵活性：** 更易于动态添加、删除和修改表单控件。
- **同步数据模型：** 表单的底层数据模型始终与表单控件同步，避免了双向绑定带来的问题。
- **强大的验证：** 提供更强大的自定义验证功能。

### 准备工作

确保你已经安装了 Angular CLI，并创建了一个新的 Angular 项目。

```sh
ng new reactive-forms-example
cd reactive-forms-example
```

接下来，导入 `ReactiveFormsModule` 到你的应用模块 (`app.module.ts`) 中:

```typescript
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms"; // 导入 ReactiveFormsModule
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    ReactiveFormsModule, // 将 ReactiveFormsModule 添加到 imports 数组
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### 构建一个简单的响应式表单

我们将创建一个简单的注册表单，包含用户名、密码和确认密码字段。

**1. 定义表单模型 (app.component.ts)**

```typescript
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  registerForm: FormGroup;

  ngOnInit() {
    this.registerForm = new FormGroup({
      username: new FormControl("", [
        Validators.required,
        Validators.minLength(3),
      ]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl("", [Validators.required]),
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
    } else {
      // 处理表单验证错误
      console.log("表单验证失败");
    }
  }
}
```

**代码解释：**

- `registerForm` 是一个 `FormGroup` 实例，代表整个表单。
- `username`, `password`, `confirmPassword` 是 `FormControl` 实例，代表表单中的每个字段。
- `Validators` 提供内置的验证器，例如 `required` 和 `minLength`。
- `onSubmit` 方法在表单提交时触发，检查表单是否有效，并打印表单值或处理错误。

**2. 创建表单模板 (app.component.html)**

```html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
  <div>
    <label for="username">Username:</label>
    <input type="text" id="username" formControlName="username" />
    <div
      *ngIf="registerForm.get('username').invalid && registerForm.get('username').touched"
    >
      <div *ngIf="registerForm.get('username').errors?.required">
        Username is required.
      </div>
      <div *ngIf="registerForm.get('username').errors?.minlength">
        Username must be at least 3 characters long.
      </div>
    </div>
  </div>

  <div>
    <label for="password">Password:</label>
    <input type="password" id="password" formControlName="password" />
    <div
      *ngIf="registerForm.get('password').invalid && registerForm.get('password').touched"
    >
      <div *ngIf="registerForm.get('password').errors?.required">
        Password is required.
      </div>
      <div *ngIf="registerForm.get('password').errors?.minlength">
        Password must be at least 8 characters long.
      </div>
    </div>
  </div>

  <div>
    <label for="confirmPassword">Confirm Password:</label>
    <input
      type="password"
      id="confirmPassword"
      formControlName="confirmPassword"
    />
    <div
      *ngIf="registerForm.get('confirmPassword').invalid && registerForm.get('confirmPassword').touched"
    >
      <div *ngIf="registerForm.get('confirmPassword').errors?.required">
        Confirm Password is required.
      </div>
    </div>
  </div>

  <button type="submit" [disabled]="!registerForm.valid">Register</button>
</form>
```

**代码解释：**

- `[formGroup]="registerForm"` 将 HTML form 元素与 TypeScript 中的 `registerForm` 绑定。
- `formControlName="username"` 将 input 元素与 TypeScript 中的 `username` FormControl 绑定。
- `*ngIf` 指令用于显示验证错误消息，只有当控件无效且已被触摸时才会显示。
- `[disabled]="!registerForm.valid"` 禁用提交按钮，直到表单有效。

### 添加自定义验证

除了内置的验证器，你还可以创建自定义的验证器。 例如，我们可以创建一个验证器来确保密码和确认密码字段的值匹配。

**1. 创建自定义验证器 (app.component.ts)**

```typescript
import { AbstractControl, ValidatorFn } from "@angular/forms";

// 自定义验证器，检查两个字段是否匹配
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get("password");
    const confirmPassword = control.get("confirmPassword");

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { passwordMismatch: true };
    }
    return null;
  };
}
```

**2. 将自定义验证器添加到表单 (app.component.ts)**

```typescript
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { passwordMatchValidator } from "./password-match.validator";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  registerForm: FormGroup;

  ngOnInit() {
    this.registerForm = new FormGroup(
      {
        username: new FormControl("", [
          Validators.required,
          Validators.minLength(3),
        ]),
        password: new FormControl("", [
          Validators.required,
          Validators.minLength(8),
        ]),
        confirmPassword: new FormControl("", [Validators.required]),
      },
      { validators: passwordMatchValidator() }
    ); // 添加自定义验证器
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
    } else {
      // 处理表单验证错误
      console.log("表单验证失败");
    }
  }
}
```

**3. 在模板中显示密码不匹配错误 (app.component.html)**

```html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
  <div>
    <label for="username">Username:</label>
    <input type="text" id="username" formControlName="username" />
    <div
      *ngIf="registerForm.get('username').invalid && registerForm.get('username').touched"
    >
      <div *ngIf="registerForm.get('username').errors?.required">
        Username is required.
      </div>
      <div *ngIf="registerForm.get('username').errors?.minlength">
        Username must be at least 3 characters long.
      </div>
    </div>
  </div>

  <div>
    <label for="password">Password:</label>
    <input type="password" id="password" formControlName="password" />
    <div
      *ngIf="registerForm.get('password').invalid && registerForm.get('password').touched"
    >
      <div *ngIf="registerForm.get('password').errors?.required">
        Password is required.
      </div>
      <div *ngIf="registerForm.get('password').errors?.minlength">
        Password must be at least 8 characters long.
      </div>
    </div>
  </div>

  <div>
    <label for="confirmPassword">Confirm Password:</label>
    <input
      type="password"
      id="confirmPassword"
      formControlName="confirmPassword"
    />
    <div
      *ngIf="registerForm.get('confirmPassword').invalid && registerForm.get('confirmPassword').touched"
    >
      <div *ngIf="registerForm.get('confirmPassword').errors?.required">
        Confirm Password is required.
      </div>
    </div>
  </div>

  <div *ngIf="registerForm.errors?.passwordMismatch && registerForm.touched">
    Passwords do not match.
  </div>

  <button type="submit" [disabled]="!registerForm.valid">Register</button>
</form>
```

### 使用 FormArray 构建动态表单

`FormArray` 允许你创建动态的表单控件，例如可以动态添加和删除的地址列表。

**1. 定义 FormArray (app.component.ts)**

```typescript
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { passwordMatchValidator } from "./password-match.validator";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  registerForm: FormGroup;

  ngOnInit() {
    this.registerForm = new FormGroup(
      {
        username: new FormControl("", [
          Validators.required,
          Validators.minLength(3),
        ]),
        password: new FormControl("", [
          Validators.required,
          Validators.minLength(8),
        ]),
        confirmPassword: new FormControl("", [Validators.required]),
        addresses: new FormArray([]), // 初始化 FormArray
      },
      { validators: passwordMatchValidator() }
    );
  }

  get addressFormArray() {
    return this.registerForm.get("addresses") as FormArray;
  }

  addAddress() {
    const addressGroup = new FormGroup({
      street: new FormControl("", Validators.required),
      city: new FormControl("", Validators.required),
      zipCode: new FormControl("", Validators.required),
    });
    this.addressFormArray.push(addressGroup);
  }

  removeAddress(index: number) {
    this.addressFormArray.removeAt(index);
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
    } else {
      // 处理表单验证错误
      console.log("表单验证失败");
    }
  }
}
```

**代码解释：**

- `addresses` 是一个 `FormArray` 实例，用于存储地址表单。
- `addressFormArray` 是一个 getter 方法，用于方便地访问 `addresses` FormArray。
- `addAddress` 方法创建一个新的 FormGroup，并将其添加到 `addresses` FormArray 中。
- `removeAddress` 方法从 `addresses` FormArray 中删除指定索引的 FormGroup。

**2. 更新模板以显示 FormArray (app.component.html)**

```html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
  <div>
    <label for="username">Username:</label>
    <input type="text" id="username" formControlName="username" />
    <div
      *ngIf="registerForm.get('username').invalid && registerForm.get('username').touched"
    >
      <div *ngIf="registerForm.get('username').errors?.required">
        Username is required.
      </div>
      <div *ngIf="registerForm.get('username').errors?.minlength">
        Username must be at least 3 characters long.
      </div>
    </div>
  </div>

  <div>
    <label for="password">Password:</label>
    <input type="password" id="password" formControlName="password" />
    <div
      *ngIf="registerForm.get('password').invalid && registerForm.get('password').touched"
    >
      <div *ngIf="registerForm.get('password').errors?.required">
        Password is required.
      </div>
      <div *ngIf="registerForm.get('password').errors?.minlength">
        Password must be at least 8 characters long.
      </div>
    </div>
  </div>

  <div>
    <label for="confirmPassword">Confirm Password:</label>
    <input
      type="password"
      id="confirmPassword"
      formControlName="confirmPassword"
    />
    <div
      *ngIf="registerForm.get('confirmPassword').invalid && registerForm.get('confirmPassword').touched"
    >
      <div *ngIf="registerForm.get('confirmPassword').errors?.required">
        Confirm Password is required.
      </div>
    </div>
  </div>

  <div *ngIf="registerForm.errors?.passwordMismatch && registerForm.touched">
    Passwords do not match.
  </div>

  <h3>Addresses:</h3>
  <div formArrayName="addresses">
    <div
      *ngFor="let address of addressFormArray.controls; let i = index"
      [formGroupName]="i"
    >
      <h4>Address {{ i + 1 }}</h4>
      <div>
        <label for="street">Street:</label>
        <input type="text" id="street" formControlName="street" />
        <div
          *ngIf="addressFormArray.at(i).get('street').invalid && addressFormArray.at(i).get('street').touched"
        >
          <div *ngIf="addressFormArray.at(i).get('street').errors?.required">
            Street is required.
          </div>
        </div>
      </div>
      <div>
        <label for="city">City:</label>
        <input type="text" id="city" formControlName="city" />
        <div
          *ngIf="addressFormArray.at(i).get('city').invalid && addressFormArray.at(i).get('city').touched"
        >
          <div *ngIf="addressFormArray.at(i).get('city').errors?.required">
            City is required.
          </div>
        </div>
      </div>
      <div>
        <label for="zipCode">Zip Code:</label>
        <input type="text" id="zipCode" formControlName="zipCode" />
        <div
          *ngIf="addressFormArray.at(i).get('zipCode').invalid && addressFormArray.at(i).get('zipCode').touched"
        >
          <div *ngIf="addressFormArray.at(i).get('zipCode').errors?.required">
            Zip Code is required.
          </div>
        </div>
      </div>
      <button type="button" (click)="removeAddress(i)">Remove Address</button>
    </div>
  </div>
  <button type="button" (click)="addAddress()">Add Address</button>

  <button type="submit" [disabled]="!registerForm.valid">Register</button>
</form>
```

**代码解释：**

- `formArrayName="addresses"` 将 div 元素与 TypeScript 中的 `addresses` FormArray 绑定。
- `*ngFor` 循环遍历 `addressFormArray.controls`，为每个地址创建一个 FormGroup。
- `[formGroupName]="i"` 将每个地址的 div 元素与 FormArray 中对应索引的 FormGroup 绑定。
- `addAddress()` 和 `removeAddress()` 按钮分别用于添加和删除地址。

### 总结

Angular 响应式表单提供了一种强大而灵活的方式来构建复杂的表单应用程序。 通过在 TypeScript 代码中定义表单结构和验证规则，你可以提高代码的可测试性、类型安全性和可维护性。 `FormArray` 更是让你轻松地处理动态表单场景。 希望这篇文章能帮助你更好地理解和使用 Angular 响应式表单。 记得实践，才是掌握的关键！

