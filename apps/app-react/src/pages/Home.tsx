import { useFrameSDK } from '../hooks/useFrameSDK';

function Home() {
  const { props, emit } = useFrameSDK();

  const handleEmitEvent = () => {
    emit('custom-event', {
      message: 'Hello from React app!',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div>
      <h2>Home Page</h2>
      <p>Welcome to the React 18 micro frontend application.</p>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Props from Parent</h3>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
          {JSON.stringify(props, null, 2)}
        </pre>
      </div>

      <button
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#0066cc',
          border: 'none',
          borderRadius: '5px',
          color: 'white',
          cursor: 'pointer',
        }}
        type="button"
        onClick={handleEmitEvent}
      >
        Emit Custom Event
      </button>
    </div>
  );
}

export default Home;
