import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Services from './pages/Services';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Products />} path="/products" />
      <Route element={<Services />} path="/services" />
    </Routes>
  );
}
