<script setup lang="ts">
import PageLayout from "../components/PageLayout.vue";
import { useFrameSDK } from "@zomme/fragment-frame-vue";

const { emit, props } = useFrameSDK();

function handleEmitEvent() {
  emit("custom-event", {
    message: "Hello from Vue Task Dashboard!",
    timestamp: new Date().toISOString(),
  });
  console.log("Custom event emitted from vue app");
}
</script>

<template>
  <PageLayout
    subtitle="A comprehensive demonstration of fragment-elements SDK capabilities using Vue 3 Composition API and modern micro-frontend patterns"
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
</style>
