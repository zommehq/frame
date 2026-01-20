import { useFrameSDK } from "@zomme/frame-react";
import { useEffect, useRef, useState } from "react";
import type { SettingsFrameProps, User } from "../types";

interface SettingsFormData {
  appName: string;
  language: string;
  notifications: boolean;
  theme: "dark" | "light";
}

export default function Settings() {
  const { emit, isReady, props, watchProps } = useFrameSDK<SettingsFrameProps>();

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
    const unwatch = watchProps(["theme", "user"], (changes) => {
      if ("theme" in changes && changes.theme) {
        const [newTheme] = changes.theme;
        setTheme(newTheme as "dark" | "light");
        setSettings((prev) => ({ ...prev, theme: newTheme as "dark" | "light" }));

        emit("theme-changed", {
          source: "watch-listener",
          theme: newTheme,
          timestamp: Date.now(),
        });
      }

      if ("user" in changes && changes.user) {
        const [newUser] = changes.user;
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

  return (
    <div style={styles.settingsPage}>
      <div style={styles.header}>
        <h1 style={styles.headerH1}>Settings</h1>
        <p style={styles.subtitle}>Configure your application preferences</p>
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
};
