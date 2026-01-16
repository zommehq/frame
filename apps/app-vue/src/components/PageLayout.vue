<script setup lang="ts">
interface Props {
  subtitle?: string;
  title: string;
}

defineProps<Props>();
</script>

<template>
  <div class="page-layout">
    <div class="header">
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>

    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-layout {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1a1a1a;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.875rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
