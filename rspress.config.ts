import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';

const SITE_URL = 'https://pi-doc.com';

export default defineConfig({
  llms: true,
  markdown: {
    link: {
      checkAnchors: false,
    },
  },
  route: {
    cleanUrls: true,
    cleanUrlsRedirect: true,
  },
  builderConfig: {
    plugins: [
      pluginGoogleAnalytics({
        id: 'G-7WCGTN4L3H',
      }),
    ],
    performance: {
      // 移除生产环境的 console 日志，减小 JS 体积
      removeConsole: true,
      // 开启构建缓存，加速重复构建
      buildCache: true,
      // 预加载当前页面的异步 chunk，加快首屏可交互时间
      preload: true,
      // 预取其他页面的 chunk，加快站内导航速度
      prefetch: true,
    },
    output: {
      // 对 JS 产物使用内容哈希，最大化浏览器缓存命中率
      filenameHash: true,
    },
  },
  // 搜索优化：不索引代码块内容，减小搜索索引体积
  search: {
    mode: 'local',
    codeBlocks: false,
  },
  root: path.join(__dirname, 'docs'),
  lang: 'zh-CN',
  title: 'Pi 中文文档',
  description:
    'Pi Coding Agent 中文文档 - 终端 AI 编码助手。提供扩展、Skills、Provider 和 Pi 包的中文参考，帮助开发者快速上手终端编码助手。',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  logoText: 'Pi 中文文档',
  globalStyles: path.join(__dirname, 'styles/global.css'),
  head: [
    // Canonical URL — 每页自动生成，防止 GitHub Pages 默认域名造成重复内容
    (route) => [
      'link',
      {
        rel: 'canonical',
        href: `${SITE_URL}${route.routePath === '/' ? '/index' : route.routePath}.html`,
      },
    ],
    // Open Graph image for social sharing
    ['meta', { property: 'og:image', content: `${SITE_URL}/rspress-icon.png` }],
    ['meta', { property: 'og:image:width', content: '512' }],
    ['meta', { property: 'og:image:height', content: '512' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'Pi 中文文档' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'Pi Coding Agent 中文文档 - 终端 AI 编码助手',
      },
    ],
  ],
  themeConfig: {
    darkMode: 'dark',
    nav: [
      { text: 'HOME', link: '/', activeMatch: '^/(index\\.html)?$' },
      { text: 'DOCS', link: '/docs/latest/quickstart', activeMatch: '/docs/' },
      { text: 'NEWS', link: '/news', activeMatch: '^/news' },
      { text: 'PACKAGES', link: '/packages', activeMatch: '^/packages' },
      { text: 'MODELS', link: '/models', activeMatch: '^/models' },
    ],
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/Q-Peppa/Q-Peppa.github.io',
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 256 256"><path fill="#C12127" d="M0 256V0h256v256z"/><path fill="#FFF" d="M48 48h160v160h-32V80h-48v128H48z"/></svg>',
        },
        mode: 'link',
        content: 'https://www.npmjs.com/package/@earendil-works/pi-coding-agent',
      },
    ],
    sidebar: {
      '/docs/latest/': [
        {
          text: '从这里开始',
          items: [
            { text: '概述', link: '/docs/latest/' },
            { text: '快速开始', link: '/docs/latest/quickstart' },
            { text: '使用 Pi', link: '/docs/latest/usage', tag: 'updated' },
            { text: 'Providers', link: '/docs/latest/providers', tag: '推荐' },
            { text: '安全', link: '/docs/latest/security', tag: 'new' },
            { text: '设置', link: '/docs/latest/settings' },
            { text: '快捷键', link: '/docs/latest/keybindings' },
            { text: '会话', link: '/docs/latest/sessions' },
            { text: '压缩', link: '/docs/latest/compaction' },
          ],
        },
        {
          text: '自定义',
          items: [
            {
              text: '扩展',
              link: '/docs/latest/extensions',
              tag: 'updated',
            },
            { text: 'Skills', link: '/docs/latest/skills' },
            { text: 'Prompt 模板', link: '/docs/latest/prompt-templates' },
            { text: '主题', link: '/docs/latest/themes' },
            { text: 'Pi Packages', link: '/docs/latest/packages' },
            { text: '自定义模型', link: '/docs/latest/models' },
            { text: '自定义 Provider', link: '/docs/latest/custom-provider' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: '环境变量', link: '/docs/latest/environment-variables' },
            { text: '会话格式', link: '/docs/latest/session-format' },
          ],
        },
        {
          text: '编程式使用',
          items: [
            { text: 'SDK', link: '/docs/latest/sdk' },
            { text: 'RPC 模式', link: '/docs/latest/rpc' },
            { text: 'JSON 事件流模式', link: '/docs/latest/json' },
            { text: 'TUI 组件', link: '/docs/latest/tui' },
          ],
        },
        {
          text: '平台设置',
          items: [
            { text: 'Windows', link: '/docs/latest/windows' },
            { text: 'Termux on Android', link: '/docs/latest/termux' },
            { text: 'tmux', link: '/docs/latest/tmux' },
            { text: '终端设置', link: '/docs/latest/terminal-setup' },
            { text: 'Shell 别名', link: '/docs/latest/shell-aliases' },
            {
              text: '容器化',
              link: '/docs/latest/containerization',
              tag: 'new',
            },
          ],
        },
        {
          text: '开发',
          items: [{ text: '开发', link: '/docs/latest/development' }],
        },
        {
          text: '源码深入',
          items: [
            { text: '概述', link: '/docs/latest/source/' },
            {
              text: '从一个最小 Agent 开始',
              link: '/docs/latest/source/minimal-agent',
              tag: '入门',
            },
            {
              text: '前置知识与学习路径',
              link: '/docs/latest/source/prerequisites',
              tag: '入门',
            },
            {
              text: '环境搭建与调试',
              link: '/docs/latest/source/setup-and-debug',
              tag: '入门',
            },
            {
              text: '从终端到 TUI',
              link: '/docs/latest/source/cli-to-tui',
              tag: '核心',
            },
            {
              text: '从输入到 LLM 循环',
              link: '/docs/latest/source/input-to-llm',
              tag: '核心',
            },
            {
              text: '核心架构与设计哲学',
              link: '/docs/latest/source/architecture',
              tag: '核心',
            },
            {
              text: 'pi-ai 运行时与 Provider',
              link: '/docs/latest/source/models-runtime',
              tag: '深入',
            },
            {
              text: '项目信任与认证',
              link: '/docs/latest/source/trust-and-auth',
              tag: '深入',
            },
            {
              text: '上下文压缩与分支',
              link: '/docs/latest/source/compaction-and-branches',
              tag: '深入',
            },
          ],
        },
      ],
    },
  },
});
