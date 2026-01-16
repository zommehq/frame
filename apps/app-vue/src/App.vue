<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useFrameSDK } from "@zomme/fragment-frame-vue";
import type { User } from "./types";

interface AppProps {
  actionCallback?: (data: any) => void;
  successCallback?: (data: any) => void;
  theme?: "dark" | "light";
  user?: User;
}

const { emit, props, watchProps } = useFrameSDK<AppProps>();
const theme = ref<"dark" | "light">(props.theme || "light");
const user = ref<User | null>(props.user || null);

onMounted(() => {
  console.log("Vue App Component initialized with user:", user.value);

  if (typeof props.successCallback === "function") {
    props.successCallback({ message: "Vue app initialized successfully" });
  }

  document.body.className = theme.value;

  // Watch for theme and user changes with modern API
  const unwatch = watchProps(['theme', 'user'], (changes) => {
    if ('theme' in changes) {
      const [newTheme] = changes.theme;
      console.log("Theme changed:", newTheme);
      theme.value = newTheme as "dark" | "light";
      document.body.className = newTheme as string;
    }

    if ('user' in changes) {
      const [newUser] = changes.user;
      console.log("User updated:", newUser);
      user.value = newUser as User;
    }
  });

  onUnmounted(unwatch);
});

function triggerAction() {
  console.log("Action triggered");

  emit("action-clicked", {
    component: "AppComponent",
    timestamp: Date.now(),
  });

  if (typeof props.actionCallback === "function") {
    props.actionCallback({
      source: "navigation",
      type: "button-click",
    });
  }
}

function triggerError() {
  try {
    throw new Error("Test error from Vue AppComponent");
  } catch (error) {
    console.error("Error triggered:", error);

    emit("error", {
      component: "AppComponent",
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });
  }
}
</script>

<template>
  <div id="app" class="app-container" :class="theme">
    <nav class="navigation">
      <ul class="nav-menu">
        <li class="nav-item">
          <router-link
            class="nav-link"
            exact-active-class="active"
            to="/"
          >
            Home
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/tasks">
            Tasks
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/analytics">
            Analytics
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/settings">
            Settings
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/about">
            About
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/contact">
            Contact
          </router-link>
        </li>
        <li class="nav-item">
          <button class="demo-btn" @click="triggerAction">
            Test Action
          </button>
        </li>
        <li class="nav-item">
          <button class="demo-btn error-btn" @click="triggerError">
            Test Error
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
  background-color: #f5f5f5;
  color: #333333;
}

.app-container.dark {
  background-color: #1a1a1a;
  color: #eeeeee;
}

.navigation {
  background-color: #42b883;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 1rem;
}

.nav-menu {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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
  border-radius: 6px;
  display: block;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.25);
}

.demo-btn {
  background: #35495e;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  font-weight: 600;
}

.demo-btn:hover {
  background: #2c3e50;
}

.demo-btn.error-btn {
  background: #ef4444;
}

.demo-btn.error-btn:hover {
  background: #dc2626;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
