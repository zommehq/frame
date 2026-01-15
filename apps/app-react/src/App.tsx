import { useFrameSDK } from './hooks/useFrameSDK';
import { DataVisualization } from './components/DataVisualization';
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Services from './pages/Services';

function App() {
  const location = useLocation();
  const { props, emit } = useFrameSDK();
  const [asyncResult, setAsyncResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Emit only the local path, parent is responsible for basePath
    emit('navigate', { path: location.pathname });
  }, [location.pathname, emit]);

  const handleAsyncAction = async () => {
    if (!props.fetchDataCallback) {
      console.warn('No fetchDataCallback provided');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling async function from parent...');

      // Chamar função assíncrona do parent
      const result = await props.fetchDataCallback({ query: 'test-query', timestamp: Date.now() });
      console.log('Data from parent:', result);
      setAsyncResult(result);
    } catch (error) {
      console.error('Error calling async function:', error);
      emit('error', { error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #61dafb', paddingBottom: '10px' }}>
        <h1>React 18 Micro App</h1>
        <nav style={{ display: 'flex', gap: '20px', marginTop: '10px', alignItems: 'center' }}>
          <Link style={{ color: '#0066cc', textDecoration: 'none' }} to="/">
            Home
          </Link>
          <Link style={{ color: '#0066cc', textDecoration: 'none' }} to="/products">
            Products
          </Link>
          <Link style={{ color: '#0066cc', textDecoration: 'none' }} to="/services">
            Services
          </Link>
          <button
            onClick={handleAsyncAction}
            disabled={loading || !props.onFetchData}
            style={{
              background: loading ? '#95a5a6' : '#e67e22',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {loading ? 'Loading...' : 'Fetch Data from Parent'}
          </button>
        </nav>
      </header>

      <main>
        <DataVisualization />

        {asyncResult && (
          <div style={{ padding: '1rem', background: '#d5f4e6', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3>Async Function Result:</h3>
            <pre>{JSON.stringify(asyncResult, null, 2)}</pre>
          </div>
        )}

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
