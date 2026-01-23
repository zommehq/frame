<script setup lang="ts">
import { useFrameSDK } from "@zomme/frame-vue";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";

interface HomeProps {
  apiUrl?: string;
  base?: string;
  theme?: "dark" | "light";
}

const { props, watchProps } = useFrameSDK<HomeProps>();

const theme = ref<"dark" | "light">(props.value.theme || "light");

const propsString = computed(() => JSON.stringify(props.value, null, 2));

onMounted(() => {
  if (props.value.theme) {
    theme.value = props.value.theme;
  }

  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme.value);

  const unwatch = watchProps(["theme"], (changes) => {
    if ("theme" in changes) {
      const [newTheme] = changes.theme;
      theme.value = newTheme as "dark" | "light";
    }
  });

  onUnmounted(unwatch);
});

watch(theme, (newTheme) => {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(newTheme);
});
</script>

<template>
  <PageLayout
    subtitle="A comprehensive demonstration of Frame SDK capabilities using Vue 3 Composition API and modern micro-frontend patterns."
    title="Welcome to Vue Task Dashboard"
  >
    <div class="info-card">
      <h3>Props from Parent</h3>
      <pre>{{ propsString }}</pre>
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

    <div class="content">
      <section class="section">
        <h2>Architecture Benefits</h2>
        <ul class="benefits-list">
          <li><strong>Independent Development:</strong> Teams can work autonomously</li>
          <li><strong>Technology Agnostic:</strong> Mix different frameworks</li>
          <li><strong>Scalability:</strong> Scale teams and features independently</li>
          <li><strong>Deployment:</strong> Deploy micro-apps separately</li>
        </ul>
      </section>
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

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.section h2 {
  color: #2c3e50;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.section p {
  color: #666;
  line-height: 1.6;
}

.benefits-list {
  color: #666;
  line-height: 1.8;
  padding-left: 1.5rem;
}

.benefits-list li {
  margin-bottom: 0.5rem;
}
</style>
