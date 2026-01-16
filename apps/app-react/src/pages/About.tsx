import { CSSProperties } from "react";
import { version } from "react";
import { PageLayout } from "../components/PageLayout";
import { useFrameSDK } from "@zomme/fragment-frame-react";

export default function About() {
  const { props } = useFrameSDK();
  const reactVersion = version;
  const basePath = (props as any).base || "/react/";
  const apiUrl = (props as any).apiUrl || "Not configured";

  const styles: Record<string, CSSProperties> = {
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
    sectionP: {
      color: "#666",
      lineHeight: 1.6,
    },
    list: {
      color: "#666",
      lineHeight: 1.8,
      paddingLeft: "1.5rem",
    },
    benefitsList: {
      color: "#666",
      lineHeight: 1.8,
      paddingLeft: "1.5rem",
    },
    benefitsListLi: {
      marginBottom: "0.5rem",
    },
    infoBox: {
      background: "linear-gradient(135deg, #61dafb 0%, #21a1c4 100%)",
      borderRadius: "8px",
      color: "white",
      padding: "1.5rem",
    },
    infoBoxH3: {
      fontSize: "1.25rem",
      marginBottom: "1rem",
    },
    infoList: {
      display: "grid",
      gap: "0.75rem",
      gridTemplateColumns: "auto 1fr",
    },
    infoListDt: {
      fontWeight: 600,
      opacity: 0.9,
    },
    infoListDd: {
      margin: 0,
    },
  };

  return (
    <PageLayout
      title="About This Application"
      subtitle="Learn about the React micro-frontend architecture and technologies"
    >
      <section style={styles.section}>
          <h2 style={styles.sectionH2}>React 18 Micro-Frontend</h2>
          <p style={styles.sectionP}>
            This application is built as a micro-frontend using React 18 and demonstrates the power
            of modern web architecture patterns. It runs independently while seamlessly integrating
            with a host application through a shared SDK.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionH2}>Key Technologies</h2>
          <ul style={styles.list}>
            <li>React 18 with Hooks</li>
            <li>React Router for navigation</li>
            <li>TypeScript for type safety</li>
            <li>Vite for fast development and optimized builds</li>
            <li>Micro-Frontend SDK for host communication</li>
          </ul>
        </section>

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

        <div style={styles.infoBox}>
          <h3 style={styles.infoBoxH3}>Application Info</h3>
          <dl style={styles.infoList}>
            <dt style={styles.infoListDt}>Framework:</dt>
            <dd style={styles.infoListDd}>React {reactVersion}</dd>
            <dt style={styles.infoListDt}>Base Path:</dt>
            <dd style={styles.infoListDd}>{basePath}</dd>
            <dt style={styles.infoListDt}>API URL:</dt>
            <dd style={styles.infoListDd}>{apiUrl}</dd>
          </dl>
        </div>
    </PageLayout>
  );
}
