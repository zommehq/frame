<template>
  <div class="app-shell">
    <header class="header">
      <h1>Micro Frontend Shell (Vue)</h1>
      <nav class="nav">
        <router-link
          v-for="app in apps"
          :key="app.name"
          :to="`/${app.name}`"
          class="nav-link"
          :class="{ active: activeApp === app.name }"
        >
          {{ app.name.charAt(0).toUpperCase() + app.name.slice(1) }}
        </router-link>
        <button class="theme-toggle" @click="toggleTheme">
          Toggle Theme ({{ currentTheme }})
        </button>
      </nav>
    </header>

    <main class="main">
      <!-- Angular Fragment -->
      <fragment-frame
        v-if="activeApp === 'angular'"
        ref="angularFrame"
        :user="currentUser"
        :theme="currentTheme"
        :successCallback="handleAngularSuccess"
        :actionCallback="handleAngularAction"
        @ready="onFrameReady"
        @navigate="onFrameNavigate"
        @error="onFrameError"
        @action-clicked="onActionClicked"
      />

      <!-- Vue Fragment -->
      <fragment-frame
        v-if="activeApp === 'vue'"
        ref="vueFrame"
        :theme="currentTheme"
        @ready="onFrameReady"
        @navigate="onFrameNavigate"
        @error="onFrameError"
        @counter-changed="onCounterChanged"
      />

      <!-- React Fragment -->
      <fragment-frame
        v-if="activeApp === 'react'"
        ref="reactFrame"
        base="/react"
        :metricsData="metricsArrayBuffer"
        :fetchDataCallback="handleFetchData"
        @ready="onFrameReady"
        @navigate="onFrameNavigate"
        @error="onFrameError"
        @data-loaded="onDataLoaded"
        @large-data="onLargeData"
      />

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface FrameConfig {
  baseUrl: string;
  name: string;
  port: number;
}

const route = useRoute();
const router = useRouter();

// Refs to fragment-frame elements
const angularFrame = ref<HTMLElement | null>(null);
const vueFrame = ref<HTMLElement | null>(null);
const reactFrame = ref<HTMLElement | null>(null);

// Apps configuration
const apps: FrameConfig[] = [
  { name: 'angular', baseUrl: 'http://localhost', port: 4201 },
  { name: 'vue', baseUrl: 'http://localhost', port: 4202 },
  { name: 'react', baseUrl: 'http://localhost', port: 4203 }
];

// Current active app
const activeApp = computed(() => {
  const path = route.path;
  for (const app of apps) {
    if (path.startsWith(`/${app.name}`)) {
      return app.name;
    }
  }
  return 'angular'; // default
});

// Props for Angular (Callbacks + Error handling)
const currentUser = ref({
  id: 1,
  name: 'John Doe',
  role: 'admin',
  email: 'john@example.com'
});

// Props for Vue and Angular (Reactivity)
const currentTheme = ref<'light' | 'dark'>('light');

// Props for React (Transferable Objects)
const metricsArrayBuffer = ref<ArrayBuffer>(new ArrayBuffer(0));


// Frame elements map
const frameElements = new Map<string, HTMLElement>();

// Callbacks for Angular
const handleAngularSuccess = (data: any) => {
  console.log('[Shell] Angular success callback received:', data);
};

const handleAngularAction = (data: any) => {
  console.log('[Shell] Angular action callback received:', data);
};

// Callback for React (Async function)
const handleFetchData = async (params: any) => {
  console.log('[Shell] Fetching data with params:', params);

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    query: params.query,
    results: [
      { id: 1, title: 'Result 1', description: 'Data from parent' },
      { id: 2, title: 'Result 2', description: 'Async callback demo' },
    ],
    timestamp: Date.now()
  };
};

// Get frame URL
const getFrameUrl = (appName: string): string => {
  const app = apps.find(a => a.name === appName);
  if (!app) return '';

  const basePath = appName === 'vue' ? '/vue/' :
                   appName === 'react' ? '/react/' :
                   appName === 'solid' ? '/solid/' : '/';

  return `${app.baseUrl}:${app.port}${basePath}`;
};

// Toggle theme
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  console.log('[Shell] Theme toggled to:', currentTheme.value);
};

// Event handlers
const onFrameReady = (event: CustomEvent) => {
  const { name } = event.detail;
  console.log(`[Shell] Fragment '${name}' is ready`);

  // Store reference to fragment-frame element
  const frameElement = event.target as HTMLElement;
  frameElements.set(name, frameElement);

  // Sync current route to the fragment-frame
  syncRouteToFrame(name);
};

const onFrameNavigate = (event: CustomEvent) => {
  const { path } = event.detail;
  const frameName = (event.target as any).getAttribute('name');

  console.log(`[Shell] Fragment '${frameName}' navigated to:`, path);

  // Update browser URL when fragment-frame navigates
  const fullPath = `/${frameName}${path}`;
  if (route.path !== fullPath) {
    router.push(fullPath);
  }
};

const onFrameError = (event: CustomEvent) => {
  const { error, message } = event.detail;
  const frameName = (event.target as any).getAttribute('name');
  console.error(`[Shell] Error from fragment '${frameName}':`, message || error);
};

const onActionClicked = (event: CustomEvent) => {
  console.log('[Shell] Action clicked event:', event.detail);
};

const onCounterChanged = (event: CustomEvent) => {
  console.log('[Shell] Counter changed:', event.detail);
};

const onDataLoaded = (event: CustomEvent) => {
  console.log('[Shell] Data loaded:', event.detail);
};

const onLargeData = (event: CustomEvent) => {
  console.log('[Shell] Large data received:', event.detail);
};


// Sync route to the newly activated fragment-frame
const syncRouteToFrame = (frameName: string) => {
  const frameElement = frameElements.get(frameName);
  if (!frameElement) return;

  // Extract the path within the fragment-frame
  const fullPath = route.path;
  const fragmentPath = fullPath.replace(`/${frameName}`, '') || '/';

  console.log(`[Shell] Syncing route to ${frameName}:`, fragmentPath);

  // Send navigation message to the fragment-frame
  // This will be handled by the fragment's SDK
  (frameElement as any).emitToChild?.('route-change', {
    path: fragmentPath,
    replace: false
  });
};

// Watch for route changes
watch(() => route.path, () => {
  // Sync route to the frame after it changes
  setTimeout(() => {
    syncRouteToFrame(activeApp.value);
  }, 100);
});

// Set attributes on fragment-frame elements
watchEffect(() => {
  if (angularFrame.value) {
    angularFrame.value.setAttribute('name', 'angular');
    angularFrame.value.setAttribute('src', getFrameUrl('angular'));
  }
  if (vueFrame.value) {
    vueFrame.value.setAttribute('name', 'vue');
    vueFrame.value.setAttribute('src', getFrameUrl('vue'));
  }
  if (reactFrame.value) {
    reactFrame.value.setAttribute('name', 'react');
    reactFrame.value.setAttribute('src', getFrameUrl('react'));
  }
});

// Initialize metrics ArrayBuffer for React
onMounted(() => {
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setFloat64(0, Math.random() * 1000); // metric1
  view.setFloat64(8, Math.random() * 100);  // metric2
  metricsArrayBuffer.value = buffer;
});
</script>

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
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: #94a3b8;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #334155;
  color: white;
}

.nav-link.active {
  background: #3b82f6;
  color: white;
}

.theme-toggle {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.theme-toggle:hover {
  background: #2563eb;
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
