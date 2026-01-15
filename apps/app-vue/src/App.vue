<script setup lang="ts">
  import { ref } from 'vue';
  import { useFrameSDK } from './composables/useFrameSDK';

  const { props, isReady, emit, onAttr } = useFrameSDK();
  const theme = ref(props.theme || 'light');
  const count = ref(0);

  // Reagir a mudanças de atributos
  onAttr('theme', (newTheme) => {
    console.log('Theme changed:', newTheme);
    theme.value = newTheme;
    document.body.className = newTheme;
  });

  // Emitir eventos para parent
  const handleClick = () => {
    count.value++;
    emit('counter-changed', { count: count.value });
  };
</script>

<template>
  <div id="app" class="app-container" :class="theme">
    <nav class="navigation">
      <h2>Vue Micro-App</h2>
      <p class="theme-info">Current theme: {{ theme }}</p>
      <ul class="nav-menu">
        <li class="nav-item">
          <router-link class="nav-link" to="/">Home</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/about">About</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/contact">Contact</router-link>
        </li>
        <li class="nav-item">
          <button class="demo-btn" @click="handleClick">
            Counter: {{ count }}
          </button>
        </li>
      </ul>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
  .app-container {
    display: flex;
    flex-direction: column;
    font-family: system-ui, -apple-system, sans-serif;
    height: 100%;
    min-height: 100vh;
    transition: background-color 0.3s;
  }

  .app-container.light {
    background-color: #ffffff;
    color: #333333;
  }

  .app-container.dark {
    background-color: #1a1a1a;
    color: #eeeeee;
  }

  .navigation {
    background-color: #42b883;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem;
  }

  .navigation h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: white;
  }

  .theme-info {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .nav-menu {
    align-items: center;
    display: flex;
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-item {
    margin: 0;
  }

  .nav-link {
    color: white;
    font-weight: 600;
    padding: 0.5rem 1rem;
    text-decoration: none;
    transition: background-color 0.2s;
    border-radius: 4px;
  }

  .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .nav-link.router-link-active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .demo-btn {
    background: #35495e;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
    font-weight: 600;
  }

  .demo-btn:hover {
    background: #2c3e50;
  }

  .main-content {
    flex: 1;
    padding: 2rem;
  }
</style>
