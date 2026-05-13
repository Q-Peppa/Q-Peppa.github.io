import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';

export default defineConfig({
  builderPlugins: [
    pluginGoogleAnalytics({
      id: 'G-7WCGTN4L3H',
    }),
  ],
  root: path.join(__dirname, 'docs'),
  title: 'Pi 中文文档',
  description: 'Pi Coding Agent 中文文档 - 终端 AI 编码助手',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  logoText: 'Pi 中文文档',
  globalStyles: path.join(__dirname, 'styles/global.css'),
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
        content: 'https://github.com/earendil-works/pi/tree/main/packages/coding-agent',
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
            { text: 'Overview', link: '/docs/latest/quickstart' },
            { text: 'Using Pi', link: '/docs/latest/usage' },
            { text: 'Providers', link: '/docs/latest/providers' },
            { text: 'Settings', link: '/docs/latest/settings' },
            { text: 'Keybindings', link: '/docs/latest/keybindings' },
            { text: 'Sessions', link: '/docs/latest/sessions' },
            { text: 'Compaction', link: '/docs/latest/compaction' },
          ],
        },
        {
          text: 'Customization',
          items: [
            { text: 'Extensions', link: '/docs/latest/extensions' },
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
            { text: 'SDK', link: '/docs/latest/sdk' },
            { text: 'RPC Mode', link: '/docs/latest/rpc' },
            { text: 'JSON Event Stream Mode', link: '/docs/latest/json' },
            { text: 'TUI Components', link: '/docs/latest/tui' },
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
