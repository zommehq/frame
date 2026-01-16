<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useFrameSDK } from "@zomme/fragment-frame-vue";
import PageLayout from "../components/PageLayout.vue";
import type { Metrics } from "../types";
import { calculateMetrics, deserializeMetrics, serializeMetrics } from "../utils/metrics";

const { emit, isReady, props } = useFrameSDK<{ metricsData?: ArrayBuffer }>();

const metrics = ref<Metrics>({
  averageCompletionTime: 0,
  completedToday: 0,
  productivityScore: 0,
  tasksCompleted: 0,
  tasksTotal: 0,
});

const isLoadingMetrics = ref(false);
const lastUpdate = ref<Date | null>(null);

onMounted(() => {
  if (props.metricsData) {
    try {
      metrics.value = deserializeMetrics(props.metricsData);
      lastUpdate.value = new Date();
    } catch (error) {
      console.error("Failed to deserialize metrics:", error);
      emit("error", {
        component: "Analytics",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }
});

function generateRandomMetrics() {
  isLoadingMetrics.value = true;

  setTimeout(() => {
    const tasksTotal = Math.floor(Math.random() * 50) + 20;
    const tasksCompleted = Math.floor(Math.random() * tasksTotal);
    const completedToday = Math.floor(Math.random() * 10);
    const averageCompletionTime = Math.floor(Math.random() * 120) + 30;

    const newMetrics = calculateMetrics(
      tasksCompleted,
      tasksTotal,
      completedToday,
      averageCompletionTime,
    );

    metrics.value = newMetrics;
    lastUpdate.value = new Date();
    isLoadingMetrics.value = false;

    emit("metrics-generated", {
      metrics: newMetrics,
      timestamp: Date.now(),
    });
  }, 500);
}

function sendMetricsToParent() {
  try {
    const buffer = serializeMetrics(metrics.value);

    emit("metrics-transferred", {
      buffer,
      metrics: metrics.value,
      size: buffer.byteLength,
      timestamp: Date.now(),
    });

    console.log("Metrics sent as Transferable ArrayBuffer:", {
      byteLength: buffer.byteLength,
      metrics: metrics.value,
    });
  } catch (error) {
    console.error("Failed to send metrics:", error);
    emit("error", {
      component: "Analytics",
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });
  }
}

function resetMetrics() {
  metrics.value = {
    averageCompletionTime: 0,
    completedToday: 0,
    productivityScore: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
  };
  lastUpdate.value = new Date();

  emit("metrics-reset", {
    timestamp: Date.now(),
  });
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
</script>

<template>
  <PageLayout subtitle="Demonstrating Transferable Objects (ArrayBuffer)" title="Analytics Dashboard">
    <div v-if="!isReady" class="loading">
      Loading SDK...
    </div>

    <template v-else>
      <div class="info-card">
        <h3>About Transferable Objects</h3>
        <p>
          This page demonstrates the use of <strong>Transferable Objects</strong> with ArrayBuffer.
          Data is serialized to binary format and transferred efficiently between the parent and child frames
          without copying, improving performance for large datasets.
        </p>
        <p v-if="lastUpdate" class="last-update">
          Last updated: {{ lastUpdate.toLocaleTimeString() }}
        </p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-label">Total Tasks</div>
            <div class="metric-value">{{ metrics.tasksTotal }}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">✅</div>
          <div class="metric-content">
            <div class="metric-label">Completed</div>
            <div class="metric-value">{{ metrics.tasksCompleted }}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-content">
            <div class="metric-label">Completed Today</div>
            <div class="metric-value">{{ metrics.completedToday }}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-content">
            <div class="metric-label">Avg. Time</div>
            <div class="metric-value">{{ formatTime(metrics.averageCompletionTime) }}</div>
          </div>
        </div>
      </div>

      <div class="productivity-card">
        <h3>Productivity Score</h3>
        <div class="score-container">
          <div
            class="score-circle"
            :style="{ borderColor: getScoreColor(metrics.productivityScore) }"
          >
            <span
              class="score-value"
              :style="{ color: getScoreColor(metrics.productivityScore) }"
            >
              {{ metrics.productivityScore }}%
            </span>
          </div>
          <div class="score-info">
            <p>
              Your productivity score is based on task completion rate.
              {{ metrics.productivityScore >= 75 ? 'Excellent work!' : '' }}
              {{ metrics.productivityScore >= 50 && metrics.productivityScore < 75 ? 'Good progress!' : '' }}
              {{ metrics.productivityScore < 50 ? 'Keep going!' : '' }}
            </p>
          </div>
        </div>
      </div>

      <div class="actions">
        <button
          class="action-btn primary"
          :disabled="isLoadingMetrics"
          @click="generateRandomMetrics"
        >
          {{ isLoadingMetrics ? 'Generating...' : 'Generate Random Metrics' }}
        </button>
        <button
          class="action-btn secondary"
          :disabled="isLoadingMetrics"
          @click="sendMetricsToParent"
        >
          Send to Parent (ArrayBuffer)
        </button>
        <button
          class="action-btn danger"
          :disabled="isLoadingMetrics"
          @click="resetMetrics"
        >
          Reset Metrics
        </button>
      </div>

      <div class="tech-details">
        <h4>Technical Details</h4>
        <ul>
          <li>
            <strong>Serialization:</strong> Metrics are encoded to UTF-8 bytes using TextEncoder
          </li>
          <li>
            <strong>Transfer:</strong> ArrayBuffer is transferred (not copied) via postMessage
          </li>
          <li>
            <strong>Performance:</strong> Zero-copy transfer improves performance for large data
          </li>
          <li>
            <strong>Buffer Size:</strong> ~{{ Math.ceil(JSON.stringify(metrics).length) }} bytes
          </li>
        </ul>
      </div>
    </template>
  </PageLayout>
</template>

<style scoped>

.loading {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.info-card {
  padding: 1.5rem;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.info-card h3 {
  margin: 0 0 0.75rem;
  color: #0c4a6e;
  font-size: 1.125rem;
}

.info-card p {
  margin: 0 0 0.5rem;
  color: #075985;
  line-height: 1.6;
}

.info-card p:last-child {
  margin-bottom: 0;
}

.last-update {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-style: italic;
  color: #0369a1;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  font-size: 2.5rem;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
}

.productivity-card {
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.productivity-card h3 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.score-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 8px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
}

.score-info {
  flex: 1;
}

.score-info p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  background: #42b883;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #35495e;
}

.action-btn.secondary {
  background: #3b82f6;
  color: white;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #2563eb;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
}

.action-btn.danger:hover:not(:disabled) {
  background: #dc2626;
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
</style>
