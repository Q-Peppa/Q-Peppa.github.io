import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
  antd: {
    import: false,
  },
  layout: false,
  routes,
  outputPath: './docs',
  mfsu: {},
  fastRefresh: true,
  publicPath: '/',
  model: {},
  title: 'leetcode 提示',
  valtio: {},
});
