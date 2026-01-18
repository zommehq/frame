import { useFrameSDK } from "@zomme/frame-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppRoutes } from "./router";
import type { User } from "./types";

interface AppProps {
  actionCallback?: (data: any) => void;
  base?: string;
  sdkAvailable?: boolean;
  successCallback?: (data: any) => void;
  theme?: "dark" | "light";
  user?: User;
}

interface FrameProps {
  base?: string;
  sdkAvailable?: boolean;
}

// Module-level flag to track if we've emitted the initial path
// This persists through React StrictMode remounts
let hasEmittedInitialPathGlobal = false;

function App({ sdkAvailable }: FrameProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { emit, on, props, watchProps } = useFrameSDK<AppProps>();
  const [theme, setTheme] = useState<"dark" | "light">(props.theme || "light");
  const [user, setUser] = useState<User | null>(props.user || null);

  useEffect(() => {
    if (typeof props.successCallback === "function") {
      props.successCallback({ message: "React app initialized successfully" });
    }

    document.body.className = theme;
  }, []);

  // Listen to route-change events from parent shell
  useEffect(() => {
    if (!sdkAvailable) return;

    const handleRouteChange = (data: any) => {
      const { path } = data as { path: string; replace?: boolean };
      navigate(path, { replace: false });
    };

    const cleanup = on("route-change", handleRouteChange);

    // Return the cleanup function provided by on()
    return cleanup;
  }, [sdkAvailable, on, navigate]);

  // Emit navigation events to parent when route changes (skip initial path)
  useEffect(() => {
    if (!sdkAvailable) return;

    // Skip emitting for the very first path we see (initial load)
    // Use module-level flag to persist through StrictMode remounts
    if (!hasEmittedInitialPathGlobal) {
      hasEmittedInitialPathGlobal = true;
      return;
    }

    // location.pathname is already relative to basename, no need to replace
    const path = location.pathname;
    emit("navigate", { path, replace: false, state: {} });
  }, [location.pathname, sdkAvailable, emit]);

  // Watch for theme and user changes with modern API
  useEffect(() => {
    const unwatch = watchProps(["theme", "user"], (changes) => {
      if ("theme" in changes && changes.theme) {
        const [newTheme] = changes.theme;
        setTheme(newTheme as "dark" | "light");
        document.body.className = newTheme as string;
      }

      if ("user" in changes && changes.user) {
        const [newUser] = changes.user;
        setUser(newUser as User);
      }
    });

    return unwatch;
  }, [watchProps]);

  const styles: Record<string, CSSProperties> = {
    appContainer: {
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, -apple-system, sans-serif",
      height: "100%",
      minHeight: "100vh",
      transition: "background-color 0.3s",
    },
    appContainerLight: {
      backgroundColor: "#f5f5f5",
      color: "#333333",
    },
    appContainerDark: {
      backgroundColor: "#1a1a1a",
      color: "#eeeeee",
    },
    navigation: {
      backgroundColor: "#61dafb",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      padding: "0.5rem 1rem",
    },
    navMenu: {
      alignItems: "center",
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "0.5rem",
      listStyle: "none",
      margin: 0,
      padding: 0,
    },
    navItem: {
      margin: 0,
    },
    navLink: {
      color: "white",
      fontWeight: 600,
      padding: "0.5rem 1rem",
      textDecoration: "none",
      transition: "background-color 0.2s",
      borderRadius: "6px",
      display: "block",
      lineHeight: 1,
    },
    navLinkHover: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    navLinkActive: {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    mainContent: {
      flex: 1,
      overflowY: "auto" as const,
    },
  };

  const containerStyle = {
    ...styles.appContainer,
    ...(theme === "light" ? styles.appContainerLight : styles.appContainerDark),
  };

  return (
    <div id="app" style={containerStyle} className={theme}>
      <nav style={styles.navigation}>
        <ul style={styles.navMenu}>
          <li style={styles.navItem}>
            <Link
              to="/"
              style={{
                ...styles.navLink,
                ...(location.pathname === "/" ? styles.navLinkActive : {}),
              }}
            >
              Home
            </Link>
          </li>
          <li style={styles.navItem}>
            <Link
              to="/tasks"
              style={{
                ...styles.navLink,
                ...(location.pathname === "/tasks" ? styles.navLinkActive : {}),
              }}
            >
              Tasks
            </Link>
          </li>
          <li style={styles.navItem}>
            <Link
              to="/analytics"
              style={{
                ...styles.navLink,
                ...(location.pathname === "/analytics" ? styles.navLinkActive : {}),
              }}
            >
              Analytics
            </Link>
          </li>
          <li style={styles.navItem}>
            <Link
              to="/settings"
              style={{
                ...styles.navLink,
                ...(location.pathname === "/settings" ? styles.navLinkActive : {}),
              }}
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      <main style={styles.mainContent}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
