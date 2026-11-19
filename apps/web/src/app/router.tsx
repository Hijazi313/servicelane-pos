import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { App } from './app';

const rootRoute = createRootRoute();
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: App });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: App });
const passwordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/change-password', component: App });

export const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute, loginRoute, passwordRoute]) });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
