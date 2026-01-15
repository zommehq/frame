<template>
  <div class="view-container">
    <h1 class="title">Welcome to Vue Micro-App</h1>
    <p class="description">
      This is the home page of the Vue 3 micro-frontend application. It demonstrates
      integration with the micro-frontend architecture using the shared SDK.
    </p>
    <div class="features">
      <div class="feature-card">
        <h3>Vue 3</h3>
        <p>Built with the latest Vue 3 Composition API</p>
      </div>
      <div class="feature-card">
        <h3>Vue Router</h3>
        <p>Client-side routing integrated with parent app</p>
      </div>
      <div class="feature-card">
        <h3>Micro-Frontend SDK</h3>
        <p>Seamless communication with the host application</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { microAppSDK } from '@shared/sdk';

const handleEmitEvent = () => {
  microAppSDK.emit('vue-app-event', { message: 'Hello from Vue!' });
};
</script>

<style scoped>
.view-container {
  max-width: 1200px;
}

.title {
  color: #42b883;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.description {
  color: #666;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.features {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.feature-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  color: #42b883;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #666;
  line-height: 1.5;
  margin: 0;
}
</style>
