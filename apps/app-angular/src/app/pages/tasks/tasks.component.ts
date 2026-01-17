import { CommonModule } from "@angular/common";
import { Component, type OnDestroy, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// biome-ignore lint/style/useImportType: FramePropsService needs to be a regular import for Angular DI
import { FramePropsService } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { TasksFragmentProps } from "../../models/fragment-props";

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.css",
})
export class TasksComponent implements OnDestroy {
  isReady = signal(false);
  editingTaskId = signal<number | null>(null);

  // Reactive props using Signal - always current, no getter needed!
  protected readonly props = this.framePropsService.asSignal<TasksFragmentProps>();

  constructor(private framePropsService: FramePropsService) {
    this.isReady.set(true);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  async setFilter(newFilter: "active" | "all" | "completed") {
    const props = this.props();
    await props.setFilter?.(newFilter);
  }

  async toggleTask(taskId: number) {
    await this.props().toggleTask?.(taskId);
  }

  async deleteTask(taskId: number) {
    await this.props().deleteTask?.(taskId);
  }

  async addTask() {
    const newTask = await this.props().addRandomTask?.();
    if (newTask) {
      this.editingTaskId.set(newTask.id);
    }
  }

  startEdit(taskId: number) {
    this.editingTaskId.set(taskId);
  }

  cancelEdit() {
    this.editingTaskId.set(null);
  }

  async saveEdit(taskId: number, title: string, description: string, priority: string) {
    const updatedTask = await this.props().updateTask?.(taskId, {
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
    await this.props().setSearchQuery?.(target.value);
  }
}
