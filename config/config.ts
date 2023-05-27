import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
  antd: {},
  routes,
  outputPath: './docs',
  mfsu: {},
  fastRefresh: true,
  publicPath: '/',
  model: {},
});
