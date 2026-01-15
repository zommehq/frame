<script setup lang="ts">
  import { useFrameSDK } from '../composables/useFrameSDK';
  import { computed, version } from 'vue';

  const { props } = useFrameSDK();
  const vueVersion = version;
  const basePath = computed(() => props.base || '/vue/');
  const apiUrl = computed(() => props.apiUrl || 'Not configured');
</script>

<template>
  <div class="view-container">
    <h1 class="title">About This Application</h1>
    <div class="content">
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
    </div>
  </div>
</template>

<style scoped>
  .view-container {
    max-width: 800px;
  }

  .title {
    color: #42b883;
    font-size: 2.5rem;
    margin-bottom: 2rem;
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

  .tech-list,
  .benefits-list {
    color: #666;
    line-height: 1.8;
    padding-left: 1.5rem;
  }

  .benefits-list li {
    margin-bottom: 0.5rem;
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
