import { Route, Routes } from '@solidjs/router';
import { lazy } from 'solid-js';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
    </Routes>
  );
}
