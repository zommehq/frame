import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
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
  tasks: Task[] = [];
  filter: "active" | "all" | "completed" = "all";
  searchQuery = "";
  isReady = false;

  constructor() {
    const props = frameSDK.props as { tasks?: Task[] };
    this.tasks = props.tasks || [
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
    ];
    this.isReady = true;
  }

  get filteredTasks(): Task[] {
    let result = this.tasks;

    if (this.filter === "active") {
      result = result.filter((t) => !t.completed);
    } else if (this.filter === "completed") {
      result = result.filter((t) => t.completed);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
      );
    }

    return result;
  }

  get taskStats() {
    return {
      active: this.tasks.filter((t) => !t.completed).length,
      completed: this.tasks.filter((t) => t.completed).length,
      total: this.tasks.length,
    };
  }

  toggleTask(taskId: number) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;

    frameSDK.emit("task-toggled", {
      completed: task.completed,
      id: taskId,
      timestamp: Date.now(),
    });

    frameSDK.emit("task-stats-changed", this.taskStats);
  }

  deleteTask(taskId: number) {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return;

    const task = this.tasks[index];
    this.tasks.splice(index, 1);

    frameSDK.emit("task-deleted", {
      id: taskId,
      title: task.title,
    });

    frameSDK.emit("task-stats-changed", this.taskStats);
  }

  addTask() {
    const newTask: Task = {
      completed: false,
      description: "New task description",
      id: Date.now(),
      priority: "medium",
      title: "New Task",
    };

    this.tasks.unshift(newTask);

    frameSDK.emit("task-added", {
      id: newTask.id,
      title: newTask.title,
    });

    frameSDK.emit("task-stats-changed", this.taskStats);
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
    this.searchQuery = target.value;

    frameSDK.emit("search-performed", {
      query: this.searchQuery,
      results: this.filteredTasks.length,
    });
  }
}
