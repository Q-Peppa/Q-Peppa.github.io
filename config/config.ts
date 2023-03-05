import { defineConfig } from 'umi';
import routes from './routes';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: routes,
  outputPath: './',
  fastRefresh: {},
  devServer: {
    port: 8000,
  },
});
