import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';

const SITE_URL = 'https://pi-doc.com';

export default defineConfig({
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
    html: {
      tags: [
        {
          tag: 'script',
          children: `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?3873eeac604350a6d04903cde2d9e64b";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`,
          head: true,
        },
        {
          tag: 'script',
          children: `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?9a9cdab657ea4999c9c12dbd6111ec44";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`,
          head: true,
        },
      ],
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
  description: 'Pi Coding Agent 中文文档 - 终端 AI 编码助手。提供扩展、Skills、Provider 和 Pi 包的中文参考，帮助开发者快速上手终端编码助手。',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  logoText: 'Pi 中文文档',
  globalStyles: path.join(__dirname, 'styles/global.css'),
  head: [
    // Canonical URL — 每页自动生成，防止 GitHub Pages 默认域名造成重复内容
    (route) => ['link', { rel: 'canonical', href: `${SITE_URL}${route.routePath === '/' ? '/index' : route.routePath}.html` }],
    // Open Graph image for social sharing
    ['meta', { property: 'og:image', content: `${SITE_URL}/rspress-icon.png` }],
    ['meta', { property: 'og:image:width', content: '512' }],
    ['meta', { property: 'og:image:height', content: '512' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'Pi 中文文档' }],
    ['meta', { name: 'twitter:description', content: 'Pi Coding Agent 中文文档 - 终端 AI 编码助手' }],
  ],
  themeConfig: {
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
          text: 'Start here',
          items: [
            { text: 'Overview', link: '/docs/latest/' },
            { text: 'Quickstart', link: '/docs/latest/quickstart', tag: 'updated' },
            { text: 'Using Pi', link: '/docs/latest/usage' },
            { text: 'Providers', link: '/docs/latest/providers', tag: '推荐' },
            { text: 'Settings', link: '/docs/latest/settings' },
            { text: 'Keybindings', link: '/docs/latest/keybindings' },
            { text: 'Sessions', link: '/docs/latest/sessions' },
            { text: 'Compaction', link: '/docs/latest/compaction' },
          ],
        },
        {
          text: 'Customization',
          items: [
            { text: 'Extensions', link: '/docs/latest/extensions', tag: 'updated' },
            { text: 'Skills', link: '/docs/latest/skills' },
            { text: 'Prompt Templates', link: '/docs/latest/prompt-templates' },
            { text: 'Themes', link: '/docs/latest/themes' },
            { text: 'Pi Packages', link: '/docs/latest/packages' },
            { text: 'Custom Models', link: '/docs/latest/models' },
            { text: 'Custom Providers', link: '/docs/latest/custom-provider' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Session Format', link: '/docs/latest/session-format' },
          ],
        },
        {
          text: 'Programmatic Usage',
          items: [
            { text: 'SDK', link: '/docs/latest/sdk', tag: 'updated' },
            { text: 'RPC Mode', link: '/docs/latest/rpc' },
            { text: 'JSON Event Stream Mode', link: '/docs/latest/json' },
            { text: 'TUI Components', link: '/docs/latest/tui', tag: 'updated' },
          ],
        },
        {
          text: 'Platform Setup',
          items: [
            { text: 'Windows', link: '/docs/latest/windows' },
            { text: 'Termux on Android', link: '/docs/latest/termux' },
            { text: 'tmux', link: '/docs/latest/tmux' },
            { text: 'Terminal Setup', link: '/docs/latest/terminal-setup' },
            { text: 'Shell Aliases', link: '/docs/latest/shell-aliases' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Development', link: '/docs/latest/development' },
          ],
        },
      ],
    },
  },
});