<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";
import { useFrameSDK } from "@zomme/fragment-frame-vue";
import type { User } from "../types";

interface SettingsProps {
  actionCallback?: (data: any) => void;
  saveCallback?: (settings: any) => Promise<{ success: boolean; message: string }>;
  theme?: "dark" | "light";
  user?: User;
}

const { emit, isReady, props, watchProps } = useFrameSDK<SettingsProps>();

const theme = ref<"dark" | "light">(props.theme || "light");
const user = ref<User | null>(props.user || null);
const saveMessage = ref("");
const isSaving = ref(false);

const settings = ref({
  appName: "Vue Micro-App",
  language: "en",
  notifications: true,
  theme: theme.value,
});

onMounted(() => {
  if (props.theme) {
    settings.value.theme = props.theme;
    theme.value = props.theme;
  }

  // Watch for theme and user changes with modern API
  const unwatch = watchProps(['theme', 'user'], (changes) => {
    if ('theme' in changes) {
      const [newTheme] = changes.theme;
      console.log("Theme attribute changed:", newTheme);
      theme.value = newTheme as "dark" | "light";
      settings.value.theme = newTheme as "dark" | "light";

      emit("theme-changed", {
        source: "watch-listener",
        theme: newTheme,
        timestamp: Date.now(),
      });
    }

    if ('user' in changes) {
      const [newUser] = changes.user;
      console.log("User attribute changed:", newUser);
      user.value = newUser as User;

      emit("user-changed", {
        user: newUser,
      });
    }
  });

  onUnmounted(unwatch);
});

watch(theme, (newTheme) => {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(newTheme);
});

async function handleSubmit(event: Event) {
  event.preventDefault();
  isSaving.value = true;
  saveMessage.value = "";

  try {
    if (typeof props.saveCallback === "function") {
      const result = await props.saveCallback(settings.value);

      if (result.success) {
        saveMessage.value = result.message || "Settings saved successfully!";

        emit("settings-saved", {
          settings: settings.value,
          timestamp: Date.now(),
        });
      } else {
        saveMessage.value = result.message || "Failed to save settings";
      }
    } else {
      saveMessage.value = "Settings saved successfully!";

      emit("settings-saved", {
        settings: settings.value,
        timestamp: Date.now(),
      });
    }

    setTimeout(() => {
      saveMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("Error saving settings:", error);
    saveMessage.value = "Error saving settings";

    emit("error", {
      component: "Settings",
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });

    setTimeout(() => {
      saveMessage.value = "";
    }, 3000);
  } finally {
    isSaving.value = false;
  }
}

function handleReset() {
  settings.value = {
    appName: "Vue Micro-App",
    language: "en",
    notifications: true,
    theme: theme.value,
  };

  saveMessage.value = "Settings reset to defaults";

  emit("settings-reset", {
    timestamp: Date.now(),
  });

  setTimeout(() => {
    saveMessage.value = "";
  }, 3000);
}

function triggerActionCallback() {
  if (typeof props.actionCallback === "function") {
    props.actionCallback({
      component: "Settings",
      source: "callback-demo",
      timestamp: Date.now(),
      type: "test-action",
    });

    saveMessage.value = "Action callback triggered!";

    setTimeout(() => {
      saveMessage.value = "";
    }, 2000);
  } else {
    saveMessage.value = "No action callback provided";

    setTimeout(() => {
      saveMessage.value = "";
    }, 2000);
  }
}

function testThemeToggle() {
  const newTheme = theme.value === "light" ? "dark" : "light";
  emit("change-theme", { theme: newTheme });
}
</script>

<template>
  <PageLayout subtitle="Demonstrating Async Callbacks + Attribute Listeners" title="Settings">
    <div v-if="!isReady" class="loading">
      Loading SDK...
    </div>

    <template v-else>
      <div v-if="user" class="user-card">
        <div class="user-avatar">
          {{ user.name.charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="user-role">{{ user.role }}</span>
        </div>
      </div>

      <div class="info-card">
        <h3>About This Demo</h3>
        <p>
          This page demonstrates <strong>Async Callbacks</strong> and <strong>Attribute Listeners</strong>:
        </p>
        <ul>
          <li>Settings can be saved using an async callback function passed from parent</li>
          <li>Theme changes are detected via attribute listeners</li>
          <li>User data updates are synchronized automatically</li>
        </ul>
      </div>

      <form class="settings-form" @submit="handleSubmit">
        <div class="form-group">
          <label for="appName">Application Name</label>
          <input
            id="appName"
            v-model="settings.appName"
            name="appName"
            type="text"
          />
        </div>

        <div class="form-group">
          <label for="language">Language</label>
          <select id="language" v-model="settings.language" name="language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>

        <div class="form-group">
          <label for="theme">Theme</label>
          <select id="theme" v-model="settings.theme" name="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="form-group checkbox">
          <label>
            <input
              v-model="settings.notifications"
              name="notifications"
              type="checkbox"
            />
            Enable notifications
          </label>
        </div>

        <div class="form-actions">
          <button :disabled="isSaving" type="submit">
            {{ isSaving ? 'Saving...' : 'Save Settings' }}
          </button>
          <button :disabled="isSaving" type="button" @click="handleReset">
            Reset
          </button>
        </div>
      </form>

      <div v-if="saveMessage" class="message" :class="{ error: saveMessage.includes('Error') }">
        {{ saveMessage }}
      </div>

      <div class="demo-section">
        <h3>Callback Demo</h3>
        <p>Test synchronous callback functions passed from parent:</p>
        <button class="demo-btn" @click="triggerActionCallback">
          Trigger Action Callback
        </button>
      </div>

      <div class="demo-section">
        <h3>Attribute Listener Demo</h3>
        <p>Request theme change from parent (will trigger attribute listener):</p>
        <div class="theme-demo">
          <div class="theme-indicator" :class="theme">
            Current theme: <strong>{{ theme }}</strong>
          </div>
          <button class="demo-btn" @click="testThemeToggle">
            Request Theme Toggle
          </button>
        </div>
      </div>

      <div class="tech-details">
        <h4>Technical Details</h4>
        <ul>
          <li>
            <strong>Async Callbacks:</strong> saveCallback returns a Promise with result
          </li>
          <li>
            <strong>Attribute Listeners:</strong> onAttr('theme', handler) detects changes
          </li>
          <li>
            <strong>Bidirectional:</strong> Fragment can request changes via events
          </li>
          <li>
            <strong>Type Safety:</strong> TypeScript interfaces ensure correct usage
          </li>
        </ul>
      </div>
    </template>
  </PageLayout>
</template>

<style scoped>

.loading {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.user-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  color: #1a1a1a;
}

.user-info p {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.user-role {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #42b883;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.info-card {
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
}

.info-card h3 {
  margin: 0 0 0.75rem;
  color: #92400e;
  font-size: 1.125rem;
}

.info-card p {
  margin: 0 0 0.5rem;
  color: #78350f;
  line-height: 1.6;
}

.info-card ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
  color: #78350f;
}

.info-card li {
  margin-bottom: 0.25rem;
}

.settings-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #495057;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group input[type='text'],
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input[type='text']:focus,
.form-group select:focus {
  outline: none;
  border-color: #42b883;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-group.checkbox input[type='checkbox'] {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions button[type='submit'] {
  background: #42b883;
  color: white;
}

.form-actions button[type='submit']:hover:not(:disabled) {
  background: #35495e;
}

.form-actions button[type='button'] {
  background: #6c757d;
  color: white;
}

.form-actions button[type='button']:hover:not(:disabled) {
  background: #5a6268;
}

.message {
  padding: 1rem;
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 6px;
  color: #0c5460;
  font-size: 0.875rem;
}

.message.error {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.demo-section {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.demo-section h3 {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  color: #1a1a1a;
}

.demo-section p {
  margin: 0 0 1rem;
  color: #666;
  font-size: 0.875rem;
}

.demo-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
}

.demo-btn:hover {
  background: #2563eb;
}

.theme-demo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-indicator {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.theme-indicator.light {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  color: #1a1a1a;
}

.theme-indicator.dark {
  background: #1f2937;
  border: 2px solid #374151;
  color: #f9fafb;
}

.tech-details {
  padding: 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.tech-details h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #1a1a1a;
}

.tech-details ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style: disc;
}

.tech-details li {
  margin-bottom: 0.5rem;
  color: #666;
  line-height: 1.6;
}

.tech-details li:last-child {
  margin-bottom: 0;
}

.tech-details strong {
  color: #1a1a1a;
}
</style>
