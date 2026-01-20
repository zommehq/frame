import { useFrameSDK } from "@zomme/frame-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "../components/PageLayout";
import type { HomeFrameProps } from "../types";

function Home() {
  const { props } = useFrameSDK<HomeFrameProps>();

  return (
    <PageLayout
      title="Welcome to React Task Dashboard"
      subtitle="A comprehensive demonstration of Frame SDK capabilities using React 18 and modern micro-frontend patterns"
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

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.sectionH2}>Architecture Benefits</h2>
          <ul style={styles.benefitsList}>
            <li style={styles.benefitsListLi}>
              <strong>Independent Development:</strong> Teams can work autonomously
            </li>
            <li style={styles.benefitsListLi}>
              <strong>Technology Agnostic:</strong> Mix different frameworks
            </li>
            <li style={styles.benefitsListLi}>
              <strong>Scalability:</strong> Scale teams and features independently
            </li>
            <li style={styles.benefitsListLi}>
              <strong>Deployment:</strong> Deploy micro-apps separately
            </li>
          </ul>
        </section>
      </div>
    </PageLayout>
  );
}

const styles: Record<string, CSSProperties> = {
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
  },
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
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  section: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    padding: "1.5rem",
  },
  sectionH2: {
    color: "#2c3e50",
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  benefitsList: {
    color: "#666",
    lineHeight: 1.8,
    paddingLeft: "1.5rem",
    margin: 0,
  },
  benefitsListLi: {
    marginBottom: "0.5rem",
  },
};

export default Home;
