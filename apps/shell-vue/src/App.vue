<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDashboardStore } from "./store/dashboard";

interface FrameConfig {
  baseUrl: string;
  label: string;
  name: string;
  port: number;
}

const route = useRoute();
const router = useRouter();
const store = useDashboardStore();

// Apps configuration
const apps: FrameConfig[] = [
  { name: "angular", label: "Angular", baseUrl: "http://localhost", port: 4200 },
  { name: "react", label: "React", baseUrl: "http://localhost", port: 4201 },
  { name: "vue", label: "Vue", baseUrl: "http://localhost", port: 4202 },
];

// Current active app
const activeApp = computed(() => {
  const path = route.path;
  for (const app of apps) {
    if (path.startsWith(`/${app.name}`)) {
      return app.name;
    }
  }
  return "angular"; // default
});

// Props from store
const currentUser = computed(() => store.user);
const currentTheme = computed(() => store.theme);

// Props for React (Transferable Objects)
const metricsArrayBuffer = ref<ArrayBuffer>(new ArrayBuffer(0));

// Create a function to get a fresh copy of the ArrayBuffer for each frame
// This prevents the "ArrayBuffer already detached" error when the same buffer
// is transferred to multiple frames
const getMetricsArrayBuffer = () => {
  // Clone the ArrayBuffer so each frame gets its own copy
  return metricsArrayBuffer.value.slice(0);
};

// Frame elements map
const frameElements = new Map<string, HTMLElement>();

const handleSuccess = (data: any) => {
  console.log("[Shell] Success callback received:", data);
  store.addNotification({
    type: "success",
    message: data.message || "Action completed",
  });
};

const handleTaskAction = (data: any) => {
  console.log("[Shell] Task action callback received:", data);
  if (data.action === "addTask") {
    store.addTask(data.task);
  }
};

// Callback for search (Async search function)
const handleSearchCallback = async (params: any) => {
  console.log("[Shell] Search callback invoked with params:", params);

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Return mock search results
  const mockResults = [
    {
      id: 1,
      title: `Result for "${params.query}" - Task 1`,
      description: "This is a search result from the parent app",
    },
    {
      id: 2,
      title: `Result for "${params.query}" - Task 2`,
      description: "Demonstrating async callback functionality",
    },
    {
      id: 3,
      title: `Result for "${params.query}" - Task 3`,
      description: "Parent app can provide data to fragments",
    },
  ];

  return mockResults;
};

// Callback for saving settings (Async)
const handleSaveSettings = async (settings: any) => {
  console.log("[Shell] Save settings callback invoked:", settings);

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Validate settings
  if (!settings.appName || settings.appName.trim() === "") {
    return {
      success: false,
      message: "App name is required",
    };
  }

  // Save to store (in real app, would save to backend)
  console.log("[Shell] Settings saved successfully:", settings);

  store.addNotification({
    type: "success",
    message: "Settings saved successfully!",
  });

  return {
    success: true,
    message: "Settings saved successfully!",
  };
};

// Function to set frame refs dynamically
const setFrameRef = (name: string, el: any) => {
  if (el) {
    frameElements.set(name, el);
    // Set attributes
    el.setAttribute("name", name);
    el.setAttribute("src", getFrameUrl(name));
  }
};

// Get frame URL
const getFrameUrl = (appName: string): string => {
  const app = apps.find((a) => a.name === appName);
  if (!app) return "";

  const basePath = appName === "vue" ? "/vue/" : appName === "react" ? "/react/" : "/angular/";

  return `${app.baseUrl}:${app.port}${basePath}`;
};

// Toggle theme
const toggleTheme = () => {
  store.toggleTheme();
  console.log("[Shell] Theme toggled to:", store.theme);
};

// Event handlers
const onFrameReady = (event: CustomEvent) => {
  // Guard against null detail
  if (!event.detail) {
    console.warn("[Shell] Received ready event with null detail, ignoring");
    return;
  }

  const { name } = event.detail;
  if (!name) {
    console.warn("[Shell] Received ready event without name, ignoring");
    return;
  }

  console.log(
    `[Shell] Fragment '${name}' is ready. Active app: ${activeApp.value}, Will sync: ${name === activeApp.value}`,
  );

  // Store reference to fragment-frame element
  const frameElement = event.target as HTMLElement;
  frameElements.set(name, frameElement);

  // Only sync route if this is the currently active app
  if (name === activeApp.value) {
    console.log(`[Shell] Syncing route for active fragment '${name}' (with small delay for handler registration)`);
    // Small delay to allow React/Vue/Angular to register their event handlers after initialization
    setTimeout(() => {
      syncRouteToFrame(name);
    }, 50);
  } else {
    console.log(`[Shell] Skipping sync for inactive fragment '${name}'`);
  }
};

const onFrameNavigate = (event: CustomEvent) => {
  const { path } = event.detail;
  const frameName = (event.target as any).getAttribute("name");

  console.log(`[Shell] Fragment '${frameName}' navigated to:`, path);

  // Update browser URL when fragment-frame navigates
  const fullPath = `/${frameName}${path}`;
  console.log(
    `[Shell] Current route.path: ${route.path}, fullPath: ${fullPath}, will push: ${route.path !== fullPath}`,
  );

  if (route.path !== fullPath) {
    console.log(`[Shell] Pushing to:`, fullPath);
    router.push(fullPath);
  }
};

const onFrameError = (event: CustomEvent) => {
  const { error, message } = event.detail;
  const frameName = (event.target as any).getAttribute("name");
  console.error(`[Shell] Error from fragment '${frameName}':`, message || error);
  store.addNotification({
    type: "error",
    message: message || error,
  });
};

const onActionClicked = (event: CustomEvent) => {
  console.log("[Shell] Action clicked event:", event.detail);
};

const onThemeChanged = (event: CustomEvent) => {
  const { theme } = event.detail;
  console.log("[Shell] Theme changed by React app:", theme);
  store.theme = theme;
};

const onCounterChanged = (event: CustomEvent) => {
  console.log("[Shell] Counter changed:", event.detail);
};

const onSettingsSaved = (event: CustomEvent) => {
  console.log("[Shell] Settings saved:", event.detail);
  store.addNotification({
    type: "success",
    message: "Settings saved successfully!",
  });
};

const onMetricsTransferred = (event: CustomEvent) => {
  const { size, metrics } = event.detail;
  console.log("[Shell] Metrics transferred:", { size, metrics });
  store.addNotification({
    type: "info",
    message: `Metrics transferred: ${size} bytes`,
  });
};

const onRequestThemeChange = (event: CustomEvent) => {
  const { theme } = event.detail;
  console.log("[Shell] Theme change requested:", theme);
  store.theme = theme;
  store.addNotification({
    type: "info",
    message: `Theme changed to ${theme}`,
  });
};

const onContactFormSubmitted = (event: CustomEvent) => {
  console.log("[Shell] Contact form submitted:", event.detail);
  store.addNotification({
    type: "success",
    message: "Contact form submitted!",
  });
};

const onCustomEvent = (event: CustomEvent) => {
  console.log("CustomEvent handled in parent", { event });
};

// Sync route to the newly activated fragment-frame
const syncRouteToFrame = (frameName: string) => {
  const frameElement = frameElements.get(frameName);
  if (!frameElement) {
    console.warn(`[Shell] Cannot sync route - no frame element found for '${frameName}'`);
    return;
  }

  // Extract the path within the fragment-frame
  const fullPath = route.path;
  const fragmentPath = fullPath.replace(`/${frameName}`, "") || "/";

  console.log(
    `[Shell] Syncing route to ${frameName}: fullPath="${fullPath}", fragmentPath="${fragmentPath}"`,
  );

  // Send navigation message to the fragment-frame using the correct emit method
  // This will be handled by the fragment's SDK
  (frameElement as any).emit("route-change", {
    path: fragmentPath,
    replace: false,
  });
};

// Watch for route changes
watch(
  () => route.path,
  (newPath, oldPath) => {
    console.log(
      `[Shell] Route changed from ${oldPath} to ${newPath}, active app: ${activeApp.value}`,
    );
    // Sync route to the frame after it changes
    setTimeout(() => {
      console.log(`[Shell] Watch timeout: syncing route to ${activeApp.value}`);
      syncRouteToFrame(activeApp.value);
    }, 100);
  },
);

// Initialize metrics ArrayBuffer for React
// Structure matches Metrics interface: 5 Float64 values (40 bytes)
onMounted(() => {
  const buffer = new ArrayBuffer(40);
  const view = new DataView(buffer);
  view.setFloat64(0, 2.5); // averageCompletionTime (hours)
  view.setFloat64(8, 5); // completedToday
  view.setFloat64(16, 87.5); // productivityScore
  view.setFloat64(24, 42); // tasksCompleted
  view.setFloat64(32, 50); // tasksTotal
  metricsArrayBuffer.value = buffer;

  // Update metrics periodically to simulate real-time data
  setInterval(() => {
    const newBuffer = new ArrayBuffer(40);
    const newView = new DataView(newBuffer);
    newView.setFloat64(0, 2 + Math.random() * 2); // 2-4 hours
    newView.setFloat64(8, Math.floor(Math.random() * 10)); // 0-10 tasks
    newView.setFloat64(16, 70 + Math.random() * 30); // 70-100 score
    newView.setFloat64(24, 40 + Math.floor(Math.random() * 20)); // 40-60 completed
    newView.setFloat64(32, 50 + Math.floor(Math.random() * 10)); // 50-60 total
    metricsArrayBuffer.value = newBuffer;
  }, 5000);
});
</script>

<template>
  <div class="app-shell">
    <header class="header">
      <nav class="nav">
        <router-link
          v-for="app in apps"
          :key="app.name"
          :to="`/${app.name}`"
          class="nav-link"
          :class="[
            { active: activeApp === app.name },
            `nav-link-${app.name}`
          ]"
          :title="app.label"
        >
          <!-- Angular Logo -->
          <svg v-if="app.name === 'angular'" width="16" height="16" viewBox="0 0 256 272" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M.1 45.522L125.908.697l129.196 44.028-20.919 166.45-108.277 59.966-106.583-59.169L.1 45.522z"/>
            <path fill="#FFF" d="M255.104 44.725L125.908.697v270.444l108.277-59.866 20.919-166.55z"/>
            <path fill="currentColor" d="M126.107 32.274L47.714 206.693l29.285-.498 15.739-39.347h70.325l17.233 39.845 27.99.498-82.179-174.917zm.2 55.882l26.496 55.383h-49.806l23.31-55.383z"/>
          </svg>

          <!-- React Logo -->
          <svg v-if="app.name === 'react'" width="16" height="16" viewBox="0 0 256 228" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621 6.238-30.281 2.16-54.676-11.769-62.708-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848 155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233 50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165 167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266 13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923 168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586 13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488 29.348-9.723 48.443-25.443 48.443-41.52 0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345-3.24-10.257-7.612-21.163-12.963-32.432 5.106-11 9.31-21.767 12.459-31.957 2.619.758 5.16 1.557 7.61 2.4 23.69 8.156 38.14 20.213 38.14 29.504 0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787-1.524 8.219-4.59 13.698-8.382 15.893-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246 12.376-1.098 24.068-2.894 34.671-5.345.522 2.107.986 4.173 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994 7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863-6.35-5.437-9.555-10.836-9.555-15.216 0-9.322 13.897-21.212 37.076-29.293 2.813-.98 5.757-1.905 8.812-2.773 3.204 10.42 7.406 21.315 12.477 32.332-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789 8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152 7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793 2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433 4.902.192 9.899.29 14.978.29 5.218 0 10.376-.117 15.453-.343-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026 347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815 329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627 310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695 358.489 358.489 0 0 1 11.036 20.54 329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026-.344 1.668-.73 3.367-1.15 5.09-10.622-2.452-22.155-4.275-34.23-5.408-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86-22.86-10.235-22.86-22.86 10.235-22.86 22.86-22.86Z"/>
          </svg>

          <!-- Vue Logo -->
          <svg v-if="app.name === 'vue'" width="16" height="16" viewBox="0 0 256 221" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M204.8 0H256L128 220.8 0 0h97.92L128 51.2 157.44 0h47.36Z"/>
            <path fill="#FFF" d="m0 0 128 220.8L256 0h-51.2L128 132.48 50.56 0H0Z"/>
            <path fill="currentColor" d="M50.56 0 128 133.12 204.8 0h-47.36L128 51.2 97.92 0H50.56Z"/>
          </svg>
        </router-link>

        <button class="theme-toggle" :title="`Current theme: ${currentTheme}`" @click="toggleTheme">
          <!-- Sun Icon (Light mode) -->
          <svg v-if="currentTheme === 'light'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>

          <!-- Moon Icon (Dark mode) -->
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </nav>
    </header>
    <main class="main">
      <fragment-frame
        v-for="app in apps"
        :key="app.name"
        :ref="(el: HTMLElement) => setFrameRef(app.name, el)"
        v-show="activeApp === app.name"
        .metricsData="getMetricsArrayBuffer()"
        .theme="currentTheme"
        .user="currentUser"
        .actionCallback="handleTaskAction"
        .saveCallback="handleSaveSettings"
        .searchCallback="handleSearchCallback"
        .successCallback="handleSuccess"
        @action-clicked="onActionClicked"
        @change-theme="onRequestThemeChange"
        @contact-form-submitted="onContactFormSubmitted"
        @counter-changed="onCounterChanged"
				@custom-event="onCustomEvent"
        @error="onFrameError"
        @metrics-transferred="onMetricsTransferred"
        @navigate="onFrameNavigate"
        @ready="onFrameReady"
        @settings-saved="onSettingsSaved"
        @theme-changed="onThemeChanged"
      />
    </main>
  </div>
</template>

<style>
/* Global styles to remove padding and ensure no scroll */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  background: #1e293b;
  color: white;
  padding: 0.375rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  text-decoration: none;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  width: 24px;
  height: 24px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.nav-link svg {
  transition: all 0.2s;
}

/* Framework-specific colors for active state */
.nav-link-angular.active {
  background: #dd0031;
  color: white;
}

.nav-link-angular.active:hover {
  background: #c30029;
}

.nav-link-vue.active {
  background: #42b883;
  color: white;
}

.nav-link-vue.active:hover {
  background: #35a372;
}

.nav-link-react.active {
  background: #149eca;
  color: white;
}

.nav-link-react.active:hover {
  background: #1089b3;
}

.theme-toggle {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.theme-toggle svg {
  display: block;
}

.main {
  flex: 1;
  overflow: hidden;
}

fragment-frame {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
