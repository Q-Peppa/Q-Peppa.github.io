import { defineConfig } from 'umi';
import routes from './routes';
import path from 'path';
export default defineConfig({
  antd: {},
  outputPath: path.resolve(__dirname, '../dist'),
  routes: routes,
  mfsu: {},
  fastRefresh: true,
});
