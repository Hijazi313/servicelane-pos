import { createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router';
import { App, SessionGate } from './app';
import { HomeScreen, LoginScreen, PasswordScreen } from '../features/access/access-screens';
import { MenuPage } from '../features/menu/menu-page';

const rootRoute = createRootRoute({ component: App });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <SessionGate require="staff"><HomeScreen /></SessionGate> });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: () => <SessionGate require="login"><LoginScreen /></SessionGate> });
const passwordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/change-password', component: () => <SessionGate require="restricted"><PasswordScreen /></SessionGate> });

function MenuRoute() {
  const navigate = useNavigate();
  return <SessionGate require="administrator"><MenuPage onBack={() => void navigate({ to: '/' })} /></SessionGate>;
}

const menuRoute = createRoute({ getParentRoute: () => rootRoute, path: '/menu', component: MenuRoute });

export const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute, menuRoute, loginRoute, passwordRoute]) });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
