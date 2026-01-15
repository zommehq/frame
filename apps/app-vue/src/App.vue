<template>
  <div id="app" class="app-container">
    <nav class="navigation">
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
      </ul>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { microAppSDK } from '@shared/sdk';

onMounted(() => {
  console.log('Vue micro-app mounted');
  console.log('Config:', microAppSDK.getConfig());
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  height: 100%;
  min-height: 100vh;
}

.navigation {
  background-color: #42b883;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.nav-menu {
  align-items: center;
  display: flex;
  gap: 2rem;
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
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.main-content {
  flex: 1;
  padding: 2rem;
}
</style>
