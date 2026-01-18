import { CommonModule } from "@angular/common";
import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { injectFrameProps } from "@zomme/frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { TasksFrameProps } from "../../models/frame-props";
import type { Task } from "../../models/types";

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.css",
})
export class TasksComponent {
  private tasks = injectFrameProps<TasksFrameProps>();

  // Expose data as signals for template - reactive, auto-updates from parent
  protected filteredTasks = this.tasks.filteredTasks;
  protected filter = this.tasks.filter;
  protected searchQuery = this.tasks.searchQuery;
  protected taskStats = this.tasks.taskStats;

  // Local state
  isReady = signal(true);
  editingTaskId = signal<number | null>(null);

  async setFilter(newFilter: "active" | "all" | "completed") {
    await this.tasks.setFilter(newFilter);
  }

  async toggleTask(taskId: number) {
    await this.tasks.toggleTask(taskId);
  }

  async deleteTask(taskId: number) {
    await this.tasks.deleteTask(taskId);
  }

  async addTask() {
    const newTask = await this.tasks.addRandomTask();
    if (newTask) this.editingTaskId.set((newTask as Task).id);
  }

  startEdit(taskId: number) {
    this.editingTaskId.set(taskId);
  }

  cancelEdit() {
    this.editingTaskId.set(null);
  }

  async saveEdit(taskId: number, title: string, description: string, priority: string) {
    const updatedTask = await this.tasks.updateTask(taskId, {
      description,
      priority: priority as "high" | "medium" | "low",
      title,
    });

    if (updatedTask) {
      this.editingTaskId.set(null);
    }
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

  async handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    await this.tasks.setSearchQuery(target.value);
  }
}
