import { CSSProperties, useEffect, useRef, useState } from "react";
import { version } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "../components/PageLayout";
import { useFrameSDK } from "@zomme/fragment-frame-react";

interface HomeProps {
  actionCallback?: (data: any) => void;
  apiUrl?: string;
  base?: string;
  theme?: "dark" | "light";
}

function Home() {
  const { emit, props } = useFrameSDK<HomeProps>();
  const reactVersion = version;
  const basePath = props.base || "/react/";
  const apiUrl = props.apiUrl || "Not configured";

  const [theme, setTheme] = useState<"dark" | "light">(props.theme || "light");
  const [saveMessage, setSaveMessage] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (props.theme) {
      setTheme(props.theme);
    }
  }, [props.theme]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleEmitEvent() {
    emit("custom-event", {
      message: "Hello from React Task Dashboard!",
      timestamp: new Date().toISOString(),
    });
  }

  const triggerActionCallback = () => {
    if (typeof props.actionCallback === "function") {
      props.actionCallback({
        component: "Home",
        source: "callback-demo",
        timestamp: Date.now(),
        type: "test-action",
      });

      setSaveMessage("Action callback triggered!");

      timeoutRef.current = setTimeout(() => {
        setSaveMessage("");
      }, 2000);
    } else {
      setSaveMessage("No action callback provided");

      timeoutRef.current = setTimeout(() => {
        setSaveMessage("");
      }, 2000);
    }
  };

  const testThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    emit("change-theme", { theme: newTheme });
  };

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

      <section style={styles.sdkDemoSection}>
        <h2 style={styles.sdkDemoSectionH2}>SDK Demonstrations</h2>

        <div style={styles.sdkInfoCard}>
          <h3 style={styles.sdkInfoCardH3}>About This Demo</h3>
          <p style={styles.sdkInfoCardP}>
            This page demonstrates <strong>Async Callbacks</strong> and{" "}
            <strong>Attribute Listeners</strong>:
          </p>
          <ul style={styles.sdkInfoCardUl}>
            <li style={styles.sdkInfoCardLi}>
              Settings can be saved using an async callback function passed from parent
            </li>
            <li style={styles.sdkInfoCardLi}>Theme changes are detected via attribute listeners</li>
            <li style={styles.sdkInfoCardLi}>User data updates are synchronized automatically</li>
          </ul>
        </div>

        <div style={styles.callbackDemo}>
          <h3 style={styles.callbackDemoH3}>Callback Demo</h3>
          <p style={styles.callbackDemoP}>
            Test synchronous callback functions passed from parent:
          </p>
          <button style={styles.demoBtn} type="button" onClick={triggerActionCallback}>
            Trigger Action Callback
          </button>
        </div>

        <div style={styles.attrListenerDemo}>
          <h3 style={styles.attrListenerDemoH3}>Attribute Listener Demo</h3>
          <p style={styles.attrListenerDemoP}>
            Request theme change from parent (will trigger attribute listener):
          </p>
          <div style={styles.themeDemo}>
            <div
              style={
                theme === "light"
                  ? { ...styles.themeIndicator, ...styles.themeIndicatorLight }
                  : { ...styles.themeIndicator, ...styles.themeIndicatorDark }
              }
            >
              Current theme: <strong>{theme}</strong>
            </div>
            <button style={styles.demoBtn} type="button" onClick={testThemeToggle}>
              Request Theme Toggle
            </button>
          </div>
        </div>

        <div style={styles.techDetails}>
          <h4 style={styles.techDetailsH4}>Technical Details</h4>
          <ul style={styles.techDetailsUl}>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Async Callbacks:</strong> saveCallback
              returns a Promise with result
            </li>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Attribute Listeners:</strong>{" "}
              onAttr('theme', handler) detects changes
            </li>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Bidirectional:</strong> Fragment can
              request changes via events
            </li>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Type Safety:</strong> TypeScript interfaces
              ensure correct usage
            </li>
          </ul>
        </div>

        {saveMessage && <div style={styles.message}>{saveMessage}</div>}
      </section>

      <div style={styles.appInfoBox}>
        <h3 style={styles.appInfoBoxH3}>Application Info</h3>
        <dl style={styles.appInfoList}>
          <dt style={styles.appInfoListDt}>Framework:</dt>
          <dd style={styles.appInfoListDd}>React {reactVersion}</dd>
          <dt style={styles.appInfoListDt}>Base Path:</dt>
          <dd style={styles.appInfoListDd}>{basePath}</dd>
          <dt style={styles.appInfoListDt}>API URL:</dt>
          <dd style={styles.appInfoListDd}>{apiUrl}</dd>
        </dl>
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
    marginBottom: "2rem",
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
  section: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    padding: "1.5rem",
    marginBottom: "2rem",
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
  sdkDemoSection: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  sdkDemoSectionH2: {
    color: "#2c3e50",
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  sdkInfoCard: {
    padding: "1.5rem",
    background: "#fef3c7",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  sdkInfoCardH3: {
    margin: "0 0 0.75rem",
    color: "#92400e",
    fontSize: "1.125rem",
  },
  sdkInfoCardP: {
    margin: "0 0 0.5rem",
    color: "#78350f",
    lineHeight: 1.6,
  },
  sdkInfoCardUl: {
    margin: "0.5rem 0 0",
    paddingLeft: "1.5rem",
    color: "#78350f",
  },
  sdkInfoCardLi: {
    marginBottom: "0.25rem",
  },
  callbackDemo: {
    padding: "1.5rem",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    marginBottom: "1.5rem",
  },
  callbackDemoH3: {
    margin: "0 0 0.75rem",
    fontSize: "1.125rem",
    color: "#1a1a1a",
  },
  callbackDemoP: {
    margin: "0 0 1rem",
    color: "#666",
    fontSize: "0.875rem",
  },
  demoBtn: {
    padding: "0.75rem 1.5rem",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "background 0.2s",
  },
  attrListenerDemo: {
    padding: "1.5rem",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    marginBottom: "1.5rem",
  },
  attrListenerDemoH3: {
    margin: "0 0 0.75rem",
    fontSize: "1.125rem",
    color: "#1a1a1a",
  },
  attrListenerDemoP: {
    margin: "0 0 1rem",
    color: "#666",
    fontSize: "0.875rem",
  },
  themeDemo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  themeIndicator: {
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontSize: "0.875rem",
  },
  themeIndicatorLight: {
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    color: "#1a1a1a",
  },
  themeIndicatorDark: {
    background: "#1f2937",
    border: "2px solid #374151",
    color: "#f9fafb",
  },
  techDetails: {
    padding: "1.5rem",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  techDetailsH4: {
    margin: "0 0 1rem",
    fontSize: "1rem",
    color: "#1a1a1a",
  },
  techDetailsUl: {
    margin: 0,
    paddingLeft: "1.5rem",
    listStyle: "disc",
  },
  techDetailsLi: {
    marginBottom: "0.5rem",
    color: "#666",
    lineHeight: 1.6,
  },
  techDetailsStrong: {
    color: "#1a1a1a",
  },
  message: {
    padding: "1rem",
    background: "#d1ecf1",
    border: "1px solid #bee5eb",
    borderRadius: "6px",
    color: "#0c5460",
    fontSize: "0.875rem",
    marginTop: "1rem",
  },
  appInfoBox: {
    background: "linear-gradient(135deg, #61dafb 0%, #21a1c4 100%)",
    borderRadius: "8px",
    color: "white",
    padding: "1.5rem",
  },
  appInfoBoxH3: {
    fontSize: "1.25rem",
    marginBottom: "1rem",
  },
  appInfoList: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "auto 1fr",
  },
  appInfoListDt: {
    fontWeight: 600,
    opacity: 0.9,
  },
  appInfoListDd: {
    margin: 0,
  },
};

export default Home;
