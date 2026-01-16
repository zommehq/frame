import { Link } from "react-router-dom";
import { PageLayout } from "../components/PageLayout";
import { useFrameSDK } from "@zomme/fragment-frame-react";

function Home() {
  const { emit, props } = useFrameSDK();

  function handleEmitEvent() {
    emit("custom-event", {
      message: "Hello from React Task Dashboard!",
      timestamp: new Date().toISOString(),
    });
    console.log("Custom event emitted from react app");
  }

  return (
    <PageLayout
      title="Welcome to React Task Dashboard"
      subtitle="A comprehensive demonstration of fragment-elements SDK capabilities using React 18 and modern micro-frontend patterns"
    >
      <div style={styles.infoCard}>
        <h3 style={styles.infoCardH3}>Props from Parent</h3>
        <pre style={styles.infoCardPre}>{JSON.stringify(props, null, 2)}</pre>
      </div>

      <div style={styles.features}>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>📋</div>
          <h3 style={styles.featureCardH3}>Task Management</h3>
          <p style={styles.featureCardP}>Props + Events + Search functionality</p>
          <Link style={styles.featureLink} to="/tasks">
            View Tasks →
          </Link>
        </div>

        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>📊</div>
          <h3 style={styles.featureCardH3}>Analytics Dashboard</h3>
          <p style={styles.featureCardP}>Transferable Objects with ArrayBuffer</p>
          <Link style={styles.featureLink} to="/analytics">
            View Analytics →
          </Link>
        </div>

        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>⚙️</div>
          <h3 style={styles.featureCardH3}>Settings</h3>
          <p style={styles.featureCardP}>Async Callbacks + Attribute Listeners</p>
          <Link style={styles.featureLink} to="/settings">
            View Settings →
          </Link>
        </div>
      </div>

      <div style={styles.demoSection}>
        <h3 style={styles.demoSectionH3}>SDK Features Demonstrated</h3>
        <ul style={styles.featureList}>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Props Access:</strong> Read initial props from
            parent
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Event Emission:</strong> Emit events to parent
            shell
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Event Listeners:</strong> Listen to events from
            parent
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Attribute Listeners:</strong> React to
            attribute changes
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Callbacks:</strong> Execute parent functions
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Async Callbacks:</strong> Handle promises from
            parent
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Transferable Objects:</strong> Efficient
            ArrayBuffer transfer
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Navigation:</strong> Synchronized routing with
            parent
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Error Handling:</strong> Proper error
            propagation
          </li>
          <li style={styles.featureListLi}>
            <strong style={styles.featureListStrong}>Cleanup:</strong> Memory leak prevention
          </li>
        </ul>
      </div>

      <div style={styles.actions}>
        <button style={styles.actionBtn} type="button" onClick={handleEmitEvent}>
          Emit Custom Event
        </button>
      </div>
    </PageLayout>
  );
}

const styles = {
  infoCard: {
    background: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  infoCardH3: {
    margin: "0 0 1rem",
    color: "#495057",
    fontSize: "1.125rem",
  },
  infoCardPre: {
    background: "white",
    padding: "1rem",
    borderRadius: "4px",
    overflowX: "auto",
    fontSize: "0.875rem",
    margin: "0",
  } as React.CSSProperties,
  features: {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    marginBottom: "2rem",
  },
  featureCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "1.5rem",
    transition: "all 0.2s",
  },
  featureIcon: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  featureCardH3: {
    color: "#1a1a1a",
    fontSize: "1.25rem",
    margin: "0 0 0.5rem",
  },
  featureCardP: {
    color: "#666",
    lineHeight: "1.5",
    margin: "0 0 1rem",
  },
  featureLink: {
    color: "#61dafb",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s",
  },
  demoSection: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  demoSectionH3: {
    margin: "0 0 1rem",
    color: "#1a1a1a",
    fontSize: "1.25rem",
  },
  featureList: {
    margin: "0",
    paddingLeft: "1.5rem",
    listStyle: "disc",
  },
  featureListLi: {
    color: "#666",
    lineHeight: "1.8",
    marginBottom: "0.5rem",
  },
  featureListStrong: {
    color: "#1a1a1a",
  },
  actions: {
    display: "flex",
    gap: "1rem",
  },
  actionBtn: {
    padding: "0.875rem 1.5rem",
    background: "#61dafb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "background 0.2s",
  },
} as const;

export default Home;
