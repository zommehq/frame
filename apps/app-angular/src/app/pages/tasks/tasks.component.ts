import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { frameSDK } from "@zomme/fragment-frame-angular";

import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { Task } from "../../models/types";

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.css",
})
export class TasksComponent {
  tasks = signal<Task[]>([]);
  filter = signal<"active" | "all" | "completed">("all");
  searchQuery = signal("");
  isReady = signal(false);
  editingTaskId = signal<number | null>(null);

  // Random task data for generation
  private taskTitles = [
    "Code Review",
    "Bug Fix",
    "Documentation",
    "Refactoring",
    "Design System",
    "API Integration",
    "Performance Optimization",
    "Security Audit",
    "Unit Tests",
    "E2E Tests",
    "Feature Implementation",
    "Database Migration",
    "UI/UX Improvements",
    "Code Cleanup",
    "Tech Debt"
  ];

  private taskDescriptions = [
    "Review pull requests and provide feedback",
    "Fix critical bug in production",
    "Update technical documentation",
    "Refactor legacy codebase",
    "Create reusable component library",
    "Integrate third-party API",
    "Optimize application performance",
    "Conduct security vulnerability assessment",
    "Write comprehensive unit tests",
    "Implement end-to-end test suite",
    "Build new feature from scratch",
    "Migrate database schema",
    "Enhance user interface and experience",
    "Remove dead code and improve structure",
    "Address accumulated technical debt"
  ];

  private priorities: Array<"high" | "medium" | "low"> = ["high", "high", "medium", "medium", "medium", "low"];

  constructor() {
    const props = (frameSDK.props ?? {}) as { tasks?: Task[] };
    this.tasks.set(props.tasks || [
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
    ]);
    this.isReady.set(true);
  }

  filteredTasks = computed(() => {
    let result = this.tasks();

    if (this.filter() === "active") {
      result = result.filter((t) => !t.completed);
    } else if (this.filter() === "completed") {
      result = result.filter((t) => t.completed);
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
      );
    }

    return result;
  });

  taskStats = computed(() => ({
    active: this.tasks().filter((t) => !t.completed).length,
    completed: this.tasks().filter((t) => t.completed).length,
    total: this.tasks().length,
  }));

  setFilter(newFilter: "active" | "all" | "completed") {
    this.filter.set(newFilter);
  }

  toggleTask(taskId: number) {
    const task = this.tasks().find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = this.tasks().map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    this.tasks.set(updatedTasks);

    frameSDK.emit("task-toggled", {
      completed: !task.completed,
      id: taskId,
      timestamp: Date.now(),
    });

    frameSDK.emit("task-stats-changed", this.taskStats());
  }

  deleteTask(taskId: number) {
    const task = this.tasks().find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = this.tasks().filter((t) => t.id !== taskId);
    this.tasks.set(updatedTasks);

    frameSDK.emit("task-deleted", {
      id: taskId,
      title: task.title,
    });

    frameSDK.emit("task-stats-changed", this.taskStats());
  }

  addTask() {
    const randomTitle = this.taskTitles[Math.floor(Math.random() * this.taskTitles.length)];
    const randomDescription = this.taskDescriptions[Math.floor(Math.random() * this.taskDescriptions.length)];
    const randomPriority = this.priorities[Math.floor(Math.random() * this.priorities.length)];

    const newTask: Task = {
      completed: false,
      description: randomDescription,
      id: Date.now(),
      priority: randomPriority,
      title: randomTitle,
    };

    const updatedTasks = [newTask, ...this.tasks()];
    this.tasks.set(updatedTasks);

    frameSDK.emit("task-added", {
      id: newTask.id,
      title: newTask.title,
    });

    frameSDK.emit("task-stats-changed", this.taskStats());

    // Automatically enter edit mode for the new task
    this.editingTaskId.set(newTask.id);
  }

  startEdit(taskId: number) {
    this.editingTaskId.set(taskId);
  }

  cancelEdit() {
    this.editingTaskId.set(null);
  }

  saveEdit(taskId: number, title: string, description: string, priority: string) {
    const updatedTasks = this.tasks().map((t) =>
      t.id === taskId
        ? { ...t, title, description, priority: priority as "high" | "medium" | "low" }
        : t
    );
    this.tasks.set(updatedTasks);
    this.editingTaskId.set(null);

    frameSDK.emit("task-updated", {
      id: taskId,
      title,
      timestamp: Date.now(),
    });
  }

  getPriorityColor(priority: string): string {
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

  handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);

    frameSDK.emit("search-performed", {
      query: this.searchQuery(),
      results: this.filteredTasks().length,
    });
  }
}
