import { useEffect, useRef, useState } from "react";
import { useFrameSDK } from "@zomme/fragment-frame-react";
import type { User } from "../types";

interface SettingsProps {
  actionCallback?: (data: any) => void;
  saveCallback?: (settings: any) => Promise<{ message: string; success: boolean }>;
  theme?: "dark" | "light";
  user?: User;
}

interface SettingsFormData {
  appName: string;
  language: string;
  notifications: boolean;
  theme: "dark" | "light";
}

export default function Settings() {
  const { emit, isReady, props, watchProps } = useFrameSDK<SettingsProps>();

  const [theme, setTheme] = useState<"dark" | "light">(props.theme || "light");
  const [user, setUser] = useState<User | null>(props.user || null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<SettingsFormData>({
    appName: "React Micro-App",
    language: "en",
    notifications: true,
    theme: props.theme || "light",
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (props.theme) {
      setSettings((prev) => ({ ...prev, theme: props.theme || "light" }));
      setTheme(props.theme);
    }
  }, [props.theme]);

  // Watch for theme and user changes with modern API
  useEffect(() => {
    const unwatch = watchProps(['theme', 'user'], (changes) => {
      if ('theme' in changes && changes.theme) {
        const [newTheme] = changes.theme;
        console.log("Theme attribute changed:", newTheme);
        setTheme(newTheme as "dark" | "light");
        setSettings((prev) => ({ ...prev, theme: newTheme as "dark" | "light" }));

        emit("theme-changed", {
          source: "watch-listener",
          theme: newTheme,
          timestamp: Date.now(),
        });
      }

      if ('user' in changes && changes.user) {
        const [newUser] = changes.user;
        console.log("User attribute changed:", newUser);
        setUser(newUser as User);

        emit("user-changed", {
          user: newUser,
        });
      }
    });

    return unwatch;
  }, [emit, watchProps]);

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      if (typeof props.saveCallback === "function") {
        const result = await props.saveCallback(settings);

        if (result.success) {
          setSaveMessage(result.message || "Settings saved successfully!");

          emit("settings-saved", {
            settings,
            timestamp: Date.now(),
          });
        } else {
          setSaveMessage(result.message || "Failed to save settings");
        }
      } else {
        setSaveMessage("Settings saved successfully!");

        emit("settings-saved", {
          settings,
          timestamp: Date.now(),
        });
      }

      timeoutRef.current = setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage("Error saving settings");

      emit("error", {
        component: "Settings",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      timeoutRef.current = setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      appName: "React Micro-App",
      language: "en",
      notifications: true,
      theme,
    });

    setSaveMessage("Settings reset to defaults");

    emit("settings-reset", {
      timestamp: Date.now(),
    });

    timeoutRef.current = setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  const triggerActionCallback = () => {
    if (typeof props.actionCallback === "function") {
      props.actionCallback({
        component: "Settings",
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
    <div style={styles.settingsPage}>
      <div style={styles.header}>
        <h1 style={styles.headerH1}>Settings</h1>
        <p style={styles.subtitle}>Demonstrating Async Callbacks + Attribute Listeners</p>
      </div>

      {!isReady ? (
        <div style={styles.loading}>Loading SDK...</div>
      ) : (
        <div style={styles.content}>
          {user && (
            <div style={styles.userCard}>
              <div style={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
              <div style={styles.userInfo}>
                <h3 style={styles.userInfoH3}>{user.name}</h3>
                <p style={styles.userInfoP}>{user.email}</p>
                <span style={styles.userRole}>{user.role}</span>
              </div>
            </div>
          )}

          <div style={styles.infoCard}>
            <h3 style={styles.infoCardH3}>About This Demo</h3>
            <p style={styles.infoCardP}>
              This page demonstrates <strong>Async Callbacks</strong> and{" "}
              <strong>Attribute Listeners</strong>:
            </p>
            <ul style={styles.infoCardUl}>
              <li style={styles.infoCardLi}>
                Settings can be saved using an async callback function passed from parent
              </li>
              <li style={styles.infoCardLi}>Theme changes are detected via attribute listeners</li>
              <li style={styles.infoCardLi}>User data updates are synchronized automatically</li>
            </ul>
          </div>

          <form style={styles.settingsForm} onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="appName" style={styles.formLabel}>
                Application Name
              </label>
              <input
                id="appName"
                name="appName"
                style={styles.formInput}
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="language" style={styles.formLabel}>
                Language
              </label>
              <select
                id="language"
                name="language"
                style={styles.formInput}
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="theme" style={styles.formLabel}>
                Theme
              </label>
              <select
                id="theme"
                name="theme"
                style={styles.formInput}
                value={settings.theme}
                onChange={(e) =>
                  setSettings({ ...settings, theme: e.target.value as "dark" | "light" })
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div style={styles.formGroupCheckbox}>
              <label style={styles.checkboxLabel}>
                <input
                  checked={settings.notifications}
                  name="notifications"
                  style={styles.checkbox}
                  type="checkbox"
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                />
                Enable notifications
              </label>
            </div>

            <div style={styles.formActions}>
              <button disabled={isSaving} style={styles.buttonSubmit} type="submit">
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
              <button
                disabled={isSaving}
                style={styles.buttonReset}
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>

          {saveMessage && (
            <div
              style={
                saveMessage.includes("Error")
                  ? { ...styles.message, ...styles.messageError }
                  : styles.message
              }
            >
              {saveMessage}
            </div>
          )}

          <div style={styles.demoSection}>
            <h3 style={styles.demoSectionH3}>Callback Demo</h3>
            <p style={styles.demoSectionP}>
              Test synchronous callback functions passed from parent:
            </p>
            <button style={styles.demoBtn} type="button" onClick={triggerActionCallback}>
              Trigger Action Callback
            </button>
          </div>

          <div style={styles.demoSection}>
            <h3 style={styles.demoSectionH3}>Attribute Listener Demo</h3>
            <p style={styles.demoSectionP}>
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
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  settingsPage: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "2rem",
  },
  headerH1: {
    margin: 0,
    fontSize: "2rem",
    color: "#1a1a1a",
  },
  subtitle: {
    margin: "0.5rem 0 0",
    color: "#666",
    fontSize: "0.875rem",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    color: "#666",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  userAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #61dafb 0%, #21a1c4 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
  },
  userInfoH3: {
    margin: "0 0 0.25rem",
    fontSize: "1.125rem",
    color: "#1a1a1a",
  },
  userInfoP: {
    margin: "0 0 0.5rem",
    fontSize: "0.875rem",
    color: "#666",
  },
  userRole: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    background: "#61dafb",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    alignSelf: "flex-start",
  },
  infoCard: {
    padding: "1.5rem",
    background: "#fef3c7",
    border: "1px solid #fde68a",
    borderRadius: "8px",
  },
  infoCardH3: {
    margin: "0 0 0.75rem",
    color: "#92400e",
    fontSize: "1.125rem",
  },
  infoCardP: {
    margin: "0 0 0.5rem",
    color: "#78350f",
    lineHeight: 1.6,
  },
  infoCardUl: {
    margin: "0.5rem 0 0",
    paddingLeft: "1.5rem",
    color: "#78350f",
  },
  infoCardLi: {
    marginBottom: "0.25rem",
  },
  settingsForm: {
    background: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#495057",
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  formInput: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    fontSize: "0.875rem",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  formGroupCheckbox: {
    marginBottom: "1.5rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    color: "#495057",
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  checkbox: {
    width: "1.125rem",
    height: "1.125rem",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    gap: "1rem",
    marginTop: "2rem",
  },
  buttonSubmit: {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "all 0.2s",
    background: "#61dafb",
    color: "white",
  },
  buttonReset: {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "all 0.2s",
    background: "#6c757d",
    color: "white",
  },
  message: {
    padding: "1rem",
    background: "#d1ecf1",
    border: "1px solid #bee5eb",
    borderRadius: "6px",
    color: "#0c5460",
    fontSize: "0.875rem",
  },
  messageError: {
    background: "#f8d7da",
    borderColor: "#f5c6cb",
    color: "#721c24",
  },
  demoSection: {
    padding: "1.5rem",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  demoSectionH3: {
    margin: "0 0 0.75rem",
    fontSize: "1.125rem",
    color: "#1a1a1a",
  },
  demoSectionP: {
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
};
