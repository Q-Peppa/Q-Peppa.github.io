import { defineConfig } from 'umi';
import routes from './routes';
import path from 'path';
export default defineConfig({
  antd: {},
  routes: routes,
  outputPath: './docs',
  mfsu: {},
  fastRefresh: true,
  publicPath: '/',
});
