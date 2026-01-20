<script setup lang="ts">
import { useFrameSDK } from "@zomme/frame-vue";
import { ref } from "vue";
import PageLayout from "../components/PageLayout.vue";
import type { Task, TasksFrameProps } from "../types";

const { isReady, props } = useFrameSDK<TasksFrameProps>();

// Local state for editing
const editingTaskId = ref<number | null>(null);

async function setFilter(newFilter: "active" | "all" | "completed") {
  await props.setFilter?.(newFilter);
}

async function toggleTask(taskId: number) {
  await props.toggleTask?.(taskId);
}

async function deleteTask(taskId: number) {
  await props.deleteTask?.(taskId);
}

async function addTask() {
  const newTask = await props.addRandomTask?.();
  if (newTask) {
    editingTaskId.value = (newTask as Task).id;
  }
}

function startEdit(taskId: number) {
  editingTaskId.value = taskId;
}

function cancelEdit() {
  editingTaskId.value = null;
}

async function saveEdit(taskId: number, title: string, description: string, priority: string) {
  const updatedTask = await props.updateTask?.(taskId, {
    description,
    priority: priority as "high" | "medium" | "low",
    title,
  });

  if (updatedTask) {
    editingTaskId.value = null;
  }
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

async function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  await props.setSearchQuery?.(target.value);
}
</script>

<template>
  <PageLayout subtitle="Props + Events + Search functionality" title="Task Management">
    <div v-if="!isReady" class="loading">
      Loading SDK...
    </div>

    <template v-else>
      <div class="content">
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ props.taskStats?.total || 0 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Active</span>
            <span class="stat-value active">{{ props.taskStats?.active || 0 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Completed</span>
            <span class="stat-value completed">{{ props.taskStats?.completed || 0 }}</span>
          </div>
        </div>

        <div class="controls">
          <div class="search-box">
            <input
              class="search-input"
              placeholder="Search tasks..."
              type="text"
              :value="props.searchQuery || ''"
              @input="handleSearch"
            />
          </div>
          <div class="filter-buttons">
            <button
              class="filter-btn"
              :class="{ active: props.filter === 'all' }"
              @click="setFilter('all')"
            >
              All
            </button>
            <button
              class="filter-btn"
              :class="{ active: props.filter === 'active' }"
              @click="setFilter('active')"
            >
              Active
            </button>
            <button
              class="filter-btn"
              :class="{ active: props.filter === 'completed' }"
              @click="setFilter('completed')"
            >
              Completed
            </button>
          </div>
          <button class="add-btn" @click="addTask">+ Add Task</button>
        </div>

        <div class="tasks">
          <template v-if="props.filteredTasks && props.filteredTasks.length > 0">
            <div
              v-for="task in props.filteredTasks"
              :key="task.id"
              class="task-card"
              :class="{
                completed: task.completed,
                editing: editingTaskId === task.id,
              }"
            >
              <div class="task-checkbox">
                <input
                  type="checkbox"
                  :checked="task.completed"
                  :disabled="editingTaskId === task.id"
                  @change="toggleTask(task.id)"
                />
              </div>

              <div class="task-content">
                <template v-if="editingTaskId === task.id">
                  <div class="edit-mode">
                    <input
                      ref="titleInput"
                      type="text"
                      class="edit-title"
                      :value="task.title"
                      placeholder="Task title"
                      @keyup.enter="($event) => {
                        const titleEl = ($event.target as HTMLInputElement);
                        const form = titleEl.closest('.edit-mode');
                        const descEl = form?.querySelector('.edit-description') as HTMLTextAreaElement;
                        const priorityEl = form?.querySelector('.edit-priority') as HTMLSelectElement;
                        saveEdit(task.id, titleEl.value, descEl?.value || '', priorityEl?.value || 'medium');
                      }"
                    />
                    <select
                      class="edit-priority"
                      :value="task.priority"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <textarea
                      class="edit-description"
                      :value="task.description"
                      placeholder="Task description"
                      rows="2"
                    ></textarea>
                    <div class="edit-actions">
                      <button
                        class="save-btn"
                        @click="($event) => {
                          const form = ($event.target as HTMLElement).closest('.edit-mode');
                          const titleEl = form?.querySelector('.edit-title') as HTMLInputElement;
                          const descEl = form?.querySelector('.edit-description') as HTMLTextAreaElement;
                          const priorityEl = form?.querySelector('.edit-priority') as HTMLSelectElement;
                          saveEdit(task.id, titleEl?.value || '', descEl?.value || '', priorityEl?.value || 'medium');
                        }"
                      >
                        Save
                      </button>
                      <button class="cancel-btn" @click="cancelEdit">
                        Cancel
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else>
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
                </template>
              </div>

              <div class="task-actions">
                <template v-if="editingTaskId !== task.id">
                  <button class="edit-btn" @click="startEdit(task.id)">Edit</button>
                  <button class="delete-btn" @click="deleteTask(task.id)">Delete</button>
                </template>
              </div>
            </div>
          </template>

          <div v-else class="empty-state">
            <p>No tasks found</p>
          </div>
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

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.task-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* Edit Mode Styles */
.task-card.editing {
  background-color: #f9fafb;
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.edit-title {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
}

.edit-title:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-priority {
  width: fit-content;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  appearance: none;
  cursor: pointer;
}

.edit-priority:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-description {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
}

.edit-description:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background-color: #3b82f6;
  color: white;
}

.save-btn:hover {
  background-color: #2563eb;
}

.save-btn:active {
  transform: translateY(1px);
}

.cancel-btn {
  background-color: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover {
  background-color: #d1d5db;
}

.cancel-btn:active {
  transform: translateY(1px);
}

.edit-btn {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background-color: #e5e7eb;
}

.edit-btn:active {
  transform: translateY(1px);
}

/* Disable checkbox interaction during edit */
.task-card.editing .task-checkbox input {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
