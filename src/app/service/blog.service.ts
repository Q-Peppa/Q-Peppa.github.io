import {Injectable} from '@angular/core';
import {of} from 'rxjs';


export interface Article {
  title: string;
  id: number;
  content: string;
  publishDate: Date;
  tags: string[];
  src: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  articles: Article[] = [
    {
      id: 1,
      title: 'Angular 模板语法：构建动态用户界面',
      content: 'Angular 模板语法是构建动态 Angular 应用的基石。它允许你将组件中的数据高效且清晰地呈现到视图中。本文将探讨 Angular 模板语法的核心概念，并结合 `title: string`, `id: number`, `content: string`, `publishDate: Date`, `tags: string[]` 这些常见的数据结构，演示如何在模板中巧妙地运用它们。',
      publishDate: new Date('2025-03-15'),
      tags: ['Angular', '前端'],
      src: "Angular 模板语法：构建动态用户界面.md"
    },
    {
      id: 2,
      title: '什么是 Dependency Injection',
      content: 'Dependency Injection (DI)，中文译为“依赖注入”，是一种软件设计模式，也是面向对象编程中的一种常用技术。它的核心思想是将组件（或对象）的依赖关系从组件内部移除，转而通过外部“注入”的方式提供给组件。',
      publishDate: new Date('2025-03-16'),
      tags: ['Dependency Injection', 'Angular'],
      src: "什么是 Dependency Injection.md"
    },
    {
      id: 3,
      title: 'Angular 中的依赖注入方式',
      src: 'Angular 中的依赖注入方式.md',
      publishDate: new Date('2025-03-16'),
      tags: ['Dependency Injection', 'Angular'],
      content: '在 Angular 中，依赖注入 (DI) 是一种核心机制，用于管理组件和服务的依赖关系。 Angular 提供了多种注入依赖的方式'
    },
    {
      id: 4,
      tags: ['Angular'],
      title: 'Angular 中的父子组件之间如何通信',
      publishDate: new Date('2025-03-19'),
      src: 'Angular 中的父子组件之间如何通信.md',
      content: '在 Angular 中，父子组件之间通信是构建复杂 UI 的关键部分。 Angular 提供了多种方式来实现这种通信，每种方式都有其适用的场景。 以下是 Angular 中父子组件通信的主要方式。'
    },
    {
      id: 5,
      title: 'Angular 组件生命周期详解',
      content: 'Angular 组件生命周期钩子函数是 Angular 开发中非常重要的概念。 它们允许你在组件的不同阶段执行代码，例如初始化、数据绑定、DOM 操作等。 本文将详细介绍 Angular 组件生命周期钩子函数及其使用场景。',
      publishDate: new Date('2025-03-22'),
      tags: ['Angular', '组件', '生命周期'],
      src: 'Angular 组件生命周期详解.md'
    },
    {
      id: 6,
      title: 'Angular 响应式表单：构建复杂的表单应用',
      content: 'Angular 响应式表单是一种强大的表单处理方式，它允许你以声明式的方式定义表单模型，并通过代码控制表单的行为。 本文将深入讲解 Angular 响应式表单的使用方法，并提供代码示例，演示如何构建复杂的表单应用。',
      publishDate: new Date('2025-03-25'),
      tags: ['Angular', '表单'],
      src: 'Angular 响应式表单：构建复杂的表单应用.md'
    },
    {
      id: 7,
      title: 'Angular 服务：构建可重用的代码模块',
      content: 'Angular 服务是一种组织和管理代码的方式，它可以将可重用的代码模块封装起来，并在不同的组件中共享。 本文将详细介绍 Angular 服务的创建、使用和最佳实践。',
      publishDate: new Date('2025-03-29'),
      tags: ['Angular', '服务',],
      src: 'Angular 服务：构建可重用的代码模块.md'
    },
    {
      id: 8,
      title: 'Angular Signals: 数据状态管理',
      content: '在Angular 16 版本引入的Signals 响应式系统,  可以使用 `signal` 定义组件内部状态,  使用 `computed` 从状态派生新值,  使用 `effect` 副作用.',
      publishDate: new Date('2025-04-01'),
      tags: ['Angular', 'Signals',],
      src: 'Angular Signals：数据状态管理.md'
    },
    {
      src:'Angular 新控制流语法.md',
      id: 9,
      title: 'Angular 新控制流语法',
      publishDate: new Date('2025-04-01'),
      content:'Angular v17 引入了新的控制流语法，旨在取代传统的 `*ngIf`, `*ngFor`, 和 `ngSwitch`。 新语法使用 `@` 符号开头，例如 `@if`, `@for`, 和 `@switch`，提供了更简洁、更易读、更利于类型检查和优化的模板语法。  本文将对比新旧控制流语法，并详细介绍新语法带来的优势。',
      tags: ['Angular',],
    },
    {
      src:'Angular 新控制流语法结合 Async 管道：优雅处理异步数据.md',
      title:'Angular 新控制流语法结合 Async 管道：优雅处理异步数据',
      id: 10,
      publishDate: new Date('2025-04-01'),
      tags: ['Angular',],
      content:'Angular 新的控制流语法（@if, @for, @switch）与 Async 管道结合使用，可以优雅地处理异步数据流，简化模板代码并提高可读性。 本文将介绍如何将两者结合使用，并展示其带来的好处。',
    }
    // ... 更多文章
  ];

  constructor() {
  }

  getAllBlog() {
    return of(this.articles)
  }

  getBlogById(id: number) {
    return of(this.articles.find((article) => article.id === id))
  }
}
