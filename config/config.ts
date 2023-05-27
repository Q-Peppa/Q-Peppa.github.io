import { defineConfig } from 'umi';
import routes from './routes';
export default defineConfig({
  antd: {},
  routes,
  outputPath: './docs',
  mfsu: {},
  fastRefresh: true,
  publicPath: '/',
});
