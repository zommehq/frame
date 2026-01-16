import { defineStore } from "pinia";
import type { DashboardState, Metrics, Notification, Task } from "../types";

export const useDashboardStore = defineStore("dashboard", {
  state: (): DashboardState => ({
    theme: "light",
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    },
    tasks: [
      {
        id: 1,
        title: "Complete dashboard implementation",
        description: "Implement all features in 3 frameworks",
        priority: "high",
        completed: false,
      },
      {
        id: 2,
        title: "Test fragment communication",
        description: "Verify props, events, and callbacks",
        priority: "medium",
        completed: false,
      },
      {
        id: 3,
        title: "Add error handling",
        description: "Implement error boundaries",
        priority: "low",
        completed: true,
      },
    ],
    metricsData: null,
    notifications: [],
  }),

  getters: {
    metrics(): Metrics {
      const total = this.tasks.length;
      const completed = this.tasks.filter((t) => t.completed).length;
      const _pending = total - completed;

      return {
        tasksTotal: total,
        tasksCompleted: completed,
        completedToday: completed,
        productivityScore: total > 0 ? Math.round((completed / total) * 100) : 0,
        averageCompletionTime: 45, // minutes (mock)
      };
    },

    activeTasks(): Task[] {
      return this.tasks.filter((t) => !t.completed);
    },

    completedTasks(): Task[] {
      return this.tasks.filter((t) => t.completed);
    },
  },

  actions: {
    toggleTheme() {
      this.theme = this.theme === "light" ? "dark" : "light";
    },

    addTask(task: Omit<Task, "id">) {
      const newTask: Task = {
        ...task,
        id: Math.max(0, ...this.tasks.map((t) => t.id)) + 1,
      };
      this.tasks.push(newTask);

      this.addNotification({
        type: "success",
        message: `Task "${task.title}" added successfully`,
      });

      return newTask;
    },

    toggleTask(taskId: number) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        task.completed = !task.completed;

        if (task.completed) {
          this.addNotification({
            type: "success",
            message: `Task "${task.title}" completed!`,
          });
        }
      }
    },

    deleteTask(taskId: number) {
      const index = this.tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        const task = this.tasks[index];
        this.tasks.splice(index, 1);

        this.addNotification({
          type: "info",
          message: `Task "${task.title}" deleted`,
        });
      }
    },

    async searchTasks(query: string): Promise<Task[]> {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const lowerQuery = query.toLowerCase();
      return this.tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery),
      );
    },

    updateMetricsData() {
      // Create ArrayBuffer with metrics data
      const buffer = new ArrayBuffer(32);
      const view = new DataView(buffer);

      const metrics = this.metrics;
      view.setFloat64(0, metrics.tasksTotal);
      view.setFloat64(8, metrics.tasksCompleted);
      view.setFloat64(16, metrics.productivityScore);
      view.setFloat64(24, metrics.averageCompletionTime);

      this.metricsData = buffer;
    },

    addNotification(notification: Omit<Notification, "id" | "timestamp">) {
      const newNotification: Notification = {
        ...notification,
        id: Date.now(),
        timestamp: Date.now(),
      };

      this.notifications.unshift(newNotification);

      // Keep only last 10 notifications
      if (this.notifications.length > 10) {
        this.notifications = this.notifications.slice(0, 10);
      }
    },

    clearNotifications() {
      this.notifications = [];
    },
  },
});
