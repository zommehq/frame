<script setup lang="ts">
import { useFrameSDK } from "@zomme/frame-vue";
import { computed, onMounted, onUnmounted, ref, version, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";

interface HomeProps {
  actionCallback?: (data: any) => void;
  base?: string;
  theme?: "dark" | "light";
}

const { emit, props, watchProps } = useFrameSDK<HomeProps>();
const vueVersion = version;
const basePath = computed(() => props.base || "/vue/");
const apiUrl = computed(() => (props as any).apiUrl || "Not configured");

const theme = ref<"dark" | "light">(props.theme || "light");
const saveMessage = ref("");

onMounted(() => {
  if (props.theme) {
    theme.value = props.theme;
  }

  // Watch for theme changes with modern API
  const unwatch = watchProps(["theme"], (changes) => {
    if ("theme" in changes) {
      const [newTheme] = changes.theme;
      theme.value = newTheme as "dark" | "light";

      emit("theme-changed", {
        source: "watch-listener",
        theme: newTheme,
        timestamp: Date.now(),
      });
    }
  });

  onUnmounted(unwatch);
});

watch(theme, (newTheme) => {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(newTheme);
});

function handleEmitEvent() {
  emit("custom-event", {
    message: "Hello from Vue Task Dashboard!",
    timestamp: new Date().toISOString(),
  });
}

function triggerActionCallback() {
  if (typeof props.actionCallback === "function") {
    props.actionCallback({
      component: "Home",
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
  <PageLayout
    subtitle="A comprehensive demonstration of Frame SDK capabilities using Vue 3 Composition API and modern micro-frontend patterns"
    title="Welcome to Vue Task Dashboard"
  >

    <div class="info-card">
      <h3>Props from Parent</h3>
      <pre>{{ JSON.stringify(props, null, 2) }}</pre>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">📋</div>
        <h3>Task Management</h3>
        <p>Props + Events + Search functionality</p>
        <router-link class="feature-link" to="/tasks">
          View Tasks →
        </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Analytics Dashboard</h3>
        <p>Transferable Objects with ArrayBuffer</p>
        <router-link class="feature-link" to="/analytics">
          View Analytics →
        </router-link>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⚙️</div>
        <h3>Settings</h3>
        <p>Async Callbacks + Attribute Listeners</p>
        <router-link class="feature-link" to="/settings">
          View Settings →
        </router-link>
      </div>
    </div>

    <div class="demo-section">
      <h3>SDK Features Demonstrated</h3>
      <ul class="feature-list">
        <li><strong>Props Access:</strong> Read initial props from parent</li>
        <li><strong>Event Emission:</strong> Emit events to parent shell</li>
        <li><strong>Event Listeners:</strong> Listen to events from parent</li>
        <li><strong>Attribute Listeners:</strong> React to attribute changes</li>
        <li><strong>Callbacks:</strong> Execute parent functions</li>
        <li><strong>Async Callbacks:</strong> Handle promises from parent</li>
        <li><strong>Transferable Objects:</strong> Efficient ArrayBuffer transfer</li>
        <li><strong>Navigation:</strong> Synchronized routing with parent</li>
        <li><strong>Error Handling:</strong> Proper error propagation</li>
        <li><strong>Cleanup:</strong> Memory leak prevention</li>
      </ul>
    </div>

    <div class="actions">
      <button class="action-btn" @click="handleEmitEvent">
        Emit Custom Event
      </button>
    </div>

    <section class="section">
      <h2>Vue 3 Micro-Frontend</h2>
      <p>
        This application is built as a micro-frontend using Vue 3 and demonstrates
        the power of modern web architecture patterns. It runs independently while
        seamlessly integrating with a host application through a shared SDK.
      </p>
    </section>

    <section class="section">
      <h2>Key Technologies</h2>
      <ul class="tech-list">
        <li>Vue 3 with Composition API</li>
        <li>Vue Router for navigation</li>
        <li>TypeScript for type safety</li>
        <li>Vite for fast development and optimized builds</li>
        <li>Micro-Frontend SDK for host communication</li>
      </ul>
    </section>

    <section class="section">
      <h2>Architecture Benefits</h2>
      <ul class="benefits-list">
        <li><strong>Independent Development:</strong> Teams can work autonomously</li>
        <li><strong>Technology Agnostic:</strong> Mix different frameworks</li>
        <li><strong>Scalability:</strong> Scale teams and features independently</li>
        <li><strong>Deployment:</strong> Deploy micro-apps separately</li>
      </ul>
    </section>

    <section class="section">
      <h2>Settings Page Demonstrations</h2>

      <div class="info-card-demo">
        <h3>About This Demo</h3>
        <p>
          The Settings page demonstrates <strong>Async Callbacks</strong> and <strong>Attribute Listeners</strong>:
        </p>
        <ul>
          <li>Settings can be saved using an async callback function passed from parent</li>
          <li>Theme changes are detected via attribute listeners</li>
          <li>User data updates are synchronized automatically</li>
        </ul>
      </div>

      <div v-if="saveMessage" class="message" :class="{ error: saveMessage.includes('Error') }">
        {{ saveMessage }}
      </div>

      <div class="demo-section-callback">
        <h3>Callback Demo</h3>
        <p>Test synchronous callback functions passed from parent:</p>
        <button class="demo-btn" @click="triggerActionCallback">
          Trigger Action Callback
        </button>
      </div>

      <div class="demo-section-callback">
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
            <strong>Bidirectional:</strong> Frame can request changes via events
          </li>
          <li>
            <strong>Type Safety:</strong> TypeScript interfaces ensure correct usage
          </li>
        </ul>
      </div>
    </section>

    <div class="info-box">
      <h3>Application Info</h3>
      <dl class="info-list">
        <dt>Framework:</dt>
        <dd>Vue {{ vueVersion }}</dd>
        <dt>Base Path:</dt>
        <dd>{{ basePath }}</dd>
        <dt>API URL:</dt>
        <dd>{{ apiUrl || 'Not configured' }}</dd>
      </dl>
    </div>
  </PageLayout>
</template>

<style scoped>

.info-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-card h3 {
  margin: 0 0 1rem;
  color: #495057;
  font-size: 1.125rem;
}

.info-card pre {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 0;
}

.features {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-bottom: 2rem;
}

.feature-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #1a1a1a;
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

.feature-card p {
  color: #666;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.feature-link {
  color: #42b883;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.feature-link:hover {
  color: #35495e;
}

.demo-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.demo-section h3 {
  margin: 0 0 1rem;
  color: #1a1a1a;
  font-size: 1.25rem;
}

.feature-list {
  margin: 0;
  padding-left: 1.5rem;
  list-style: disc;
}

.feature-list li {
  color: #666;
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

.feature-list strong {
  color: #1a1a1a;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-btn {
  padding: 0.875rem 1.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #35495e;
}

.section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section h2 {
  color: #1a1a1a;
  font-size: 1.25rem;
  margin: 0 0 1rem;
}

.section p {
  color: #666;
  line-height: 1.6;
}

.tech-list,
.benefits-list {
  color: #666;
  line-height: 1.8;
  padding-left: 1.5rem;
}

.benefits-list li {
  margin-bottom: 0.5rem;
}

.info-card-demo {
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-card-demo h3 {
  margin: 0 0 0.75rem;
  color: #92400e;
  font-size: 1.125rem;
}

.info-card-demo p {
  margin: 0 0 0.5rem;
  color: #78350f;
  line-height: 1.6;
}

.info-card-demo ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
  color: #78350f;
}

.info-card-demo li {
  margin-bottom: 0.25rem;
}

.message {
  padding: 1rem;
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 6px;
  color: #0c5460;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.message.error {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.demo-section-callback {
  padding: 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.demo-section-callback h3 {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  color: #1a1a1a;
}

.demo-section-callback p {
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

.info-box {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  border-radius: 8px;
  color: white;
  padding: 1.5rem;
}

.info-box h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.info-list {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: auto 1fr;
}

.info-list dt {
  font-weight: 600;
  opacity: 0.9;
}

.info-list dd {
  margin: 0;
}
</style>
