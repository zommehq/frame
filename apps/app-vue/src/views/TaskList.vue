<script setup lang="ts">
import { computed, ref } from "vue";
import { useFrameSDK } from "@zomme/fragment-frame-vue";
import PageLayout from "../components/PageLayout.vue";
import type { Task } from "../types";

const { emit, isReady, props } = useFrameSDK<{ tasks?: Task[] }>();

const tasks = ref<Task[]>(
  props.tasks || [
    {
      completed: false,
      description: "Review pull requests",
      id: 1,
      priority: "high",
      title: "Code Review",
    },
    {
      completed: true,
      description: "Fix bug in authentication",
      id: 2,
      priority: "high",
      title: "Bug Fix",
    },
    {
      completed: false,
      description: "Update documentation",
      id: 3,
      priority: "medium",
      title: "Documentation",
    },
    {
      completed: false,
      description: "Refactor legacy code",
      id: 4,
      priority: "low",
      title: "Refactoring",
    },
  ],
);

const filter = ref<"all" | "active" | "completed">("all");
const searchQuery = ref("");

const filteredTasks = computed(() => {
  let result = tasks.value;

  if (filter.value === "active") {
    result = result.filter((t) => !t.completed);
  } else if (filter.value === "completed") {
    result = result.filter((t) => t.completed);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
    );
  }

  return result;
});

const taskStats = computed(() => ({
  active: tasks.value.filter((t) => !t.completed).length,
  completed: tasks.value.filter((t) => t.completed).length,
  total: tasks.value.length,
}));

function toggleTask(taskId: number) {
  const task = tasks.value.find((t) => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;

  emit("task-toggled", {
    completed: task.completed,
    id: taskId,
    timestamp: Date.now(),
  });

  emit("task-stats-changed", taskStats.value);
}

function deleteTask(taskId: number) {
  const index = tasks.value.findIndex((t) => t.id === taskId);
  if (index === -1) return;

  const task = tasks.value[index];
  tasks.value.splice(index, 1);

  emit("task-deleted", {
    id: taskId,
    title: task.title,
  });

  emit("task-stats-changed", taskStats.value);
}

function addTask() {
  const newTask: Task = {
    completed: false,
    description: "New task description",
    id: Date.now(),
    priority: "medium",
    title: "New Task",
  };

  tasks.value.unshift(newTask);

  emit("task-added", {
    id: newTask.id,
    title: newTask.title,
  });

  emit("task-stats-changed", taskStats.value);
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    case "low":
      return "#10b981";
    default:
      return "#6b7280";
  }
}

function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  searchQuery.value = target.value;

  emit("search-performed", {
    query: searchQuery.value,
    results: filteredTasks.value.length,
  });
}
</script>

<template>
  <PageLayout subtitle="Demonstrating Props + Events + Search" title="Task Management">
    <div v-if="!isReady" class="loading">
      Loading SDK...
    </div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ taskStats.total }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Active</span>
          <span class="stat-value active">{{ taskStats.active }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Completed</span>
          <span class="stat-value completed">{{ taskStats.completed }}</span>
        </div>
      </div>

      <div class="controls">
        <div class="search-box">
          <input
            class="search-input"
            placeholder="Search tasks..."
            type="text"
            :value="searchQuery"
            @input="handleSearch"
          />
        </div>

        <div class="filter-buttons">
          <button
            class="filter-btn"
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >
            All
          </button>
          <button
            class="filter-btn"
            :class="{ active: filter === 'active' }"
            @click="filter = 'active'"
          >
            Active
          </button>
          <button
            class="filter-btn"
            :class="{ active: filter === 'completed' }"
            @click="filter = 'completed'"
          >
            Completed
          </button>
        </div>

        <button class="add-btn" @click="addTask">
          + Add Task
        </button>
      </div>

      <div class="tasks">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-card"
          :class="{ completed: task.completed }"
        >
          <div class="task-checkbox">
            <input
              :checked="task.completed"
              type="checkbox"
              @change="toggleTask(task.id)"
            />
          </div>

          <div class="task-content">
            <div class="task-header">
              <h3 class="task-title">{{ task.title }}</h3>
              <span
                class="task-priority"
                :style="{ backgroundColor: getPriorityColor(task.priority) }"
              >
                {{ task.priority }}
              </span>
            </div>
            <p class="task-description">{{ task.description }}</p>
          </div>

          <button
            class="delete-btn"
            @click="deleteTask(task.id)"
          >
            Delete
          </button>
        </div>

        <div v-if="filteredTasks.length === 0" class="empty-state">
          <p>No tasks found</p>
        </div>
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

.stats-bar {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-value.active {
  color: #3b82f6;
}

.stat-value.completed {
  color: #10b981;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f9fafb;
}

.filter-btn.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #35495e;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.task-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.task-card.completed {
  opacity: 0.7;
}

.task-checkbox input {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.task-content {
  flex: 1;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.task-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.task-card.completed .task-title {
  text-decoration: line-through;
}

.task-priority {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.task-description {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
}

.task-card.completed .task-description {
  text-decoration: line-through;
}

.delete-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #dc2626;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #9ca3af;
  font-size: 1rem;
}
</style>
