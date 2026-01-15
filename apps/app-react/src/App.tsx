import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Services from './pages/Services';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const config = microAppSDK.getConfig();
    const base = config.base || '/react';
    const fullPath = base + location.pathname;
    microAppSDK.navigate(fullPath);
  }, [location.pathname]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <h1>React 18 Micro App</h1>
        <nav style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <Link
            style={{ color: '#0066cc', textDecoration: 'none' }}
            to="/"
          >
            Home
          </Link>
          <Link
            style={{ color: '#0066cc', textDecoration: 'none' }}
            to="/products"
          >
            Products
          </Link>
          <Link
            style={{ color: '#0066cc', textDecoration: 'none' }}
            to="/services"
          >
            Services
          </Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<Products />} path="/products" />
          <Route element={<Services />} path="/services" />
        </Routes>
      </main>
    </div>
  );
}

export default App;
