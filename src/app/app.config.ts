import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter, withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig
} from '@angular/router';

import { routes } from './app.routes';
import {provideMarkdown } from 'ngx-markdown';
import {HttpClient, provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes ,
      withComponentInputBinding(),
      withInMemoryScrolling(),
      withPreloading(PreloadAllModules),
      withRouterConfig({ paramsInheritanceStrategy: 'always', onSameUrlNavigation: 'reload' }),
      ),

    provideMarkdown({loader: HttpClient }),
    provideHttpClient(
      withFetch(),
      withInterceptors([]),
    ),

  ]
};
