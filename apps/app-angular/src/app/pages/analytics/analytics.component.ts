import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, signal } from "@angular/core";
import { FramePropsService, injectFrameProps } from "@zomme/frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { AnalyticsFrameProps } from "../../models/frame-props";

interface Metrics {
  averageCompletionTime: number;
  completedToday: number;
  productivityScore: number;
  tasksCompleted: number;
  tasksTotal: number;
}

@Component({
  imports: [CommonModule, PageLayoutComponent],
  selector: "app-analytics",
  standalone: true,
  styleUrls: ["./analytics.component.css"],
  templateUrl: "./analytics.component.html",
})
export class AnalyticsComponent {
  private frameProps = inject(FramePropsService);
  private props = injectFrameProps<AnalyticsFrameProps>();

  // Reactive data from parent
  protected metricsData = this.props.metricsData;

  // Local state
  isReady = signal(true);
  isLoadingMetrics = signal(false);
  lastUpdate = signal<Date | null>(null);

  metrics = signal<Metrics>({
    averageCompletionTime: 0,
    completedToday: 0,
    productivityScore: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
  });

  formattedTime = computed(() => {
    const minutes = this.metrics().averageCompletionTime;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  });

  bufferSize = computed(() => {
    return Math.ceil(JSON.stringify(this.metrics()).length);
  });

  constructor() {
    // Initialize metrics from parent data when available
    effect(() => {
      const data = this.metricsData();
      if (data) {
        try {
          const deserializedMetrics = this.deserializeMetrics(data);
          this.metrics.set(deserializedMetrics);
          this.lastUpdate.set(new Date());
        } catch (error) {
          console.error("Failed to deserialize metrics:", error);
          this.frameProps.emit("error", {
            component: "Analytics",
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  generateRandomMetrics() {
    this.isLoadingMetrics.set(true);

    setTimeout(() => {
      const tasksTotal = Math.floor(Math.random() * 50) + 20;
      const tasksCompleted = Math.floor(Math.random() * tasksTotal);
      const completedToday = Math.floor(Math.random() * 10);
      const averageCompletionTime = Math.floor(Math.random() * 120) + 30;

      const newMetrics = this.calculateMetrics(
        tasksCompleted,
        tasksTotal,
        completedToday,
        averageCompletionTime,
      );

      this.metrics.set(newMetrics);
      this.lastUpdate.set(new Date());
      this.isLoadingMetrics.set(false);

      this.frameProps.emit("metrics-generated", {
        metrics: newMetrics,
        timestamp: Date.now(),
      });
    }, 500);
  }

  sendMetricsToParent() {
    try {
      const buffer = this.serializeMetrics(this.metrics());

      this.frameProps.emit("metrics-transferred", {
        buffer,
        metrics: this.metrics(),
        size: buffer.byteLength,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to send metrics:", error);
      this.frameProps.emit("error", {
        component: "Analytics",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }

  resetMetrics() {
    this.metrics.set({
      averageCompletionTime: 0,
      completedToday: 0,
      productivityScore: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
    });
    this.lastUpdate.set(new Date());

    this.frameProps.emit("metrics-reset", {
      timestamp: Date.now(),
    });
  }

  getScoreColor(score: number): string {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  }

  getScoreMessage(score: number): string {
    if (score >= 75) return "Excellent work!";
    if (score >= 50) return "Good progress!";
    return "Keep going!";
  }

  private calculateMetrics(
    tasksCompleted: number,
    tasksTotal: number,
    completedToday: number,
    averageCompletionTime: number,
  ): Metrics {
    const productivityScore = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    return {
      averageCompletionTime,
      completedToday,
      productivityScore,
      tasksCompleted,
      tasksTotal,
    };
  }

  private serializeMetrics(metrics: Metrics): ArrayBuffer {
    const json = JSON.stringify(metrics);
    const encoder = new TextEncoder();
    return encoder.encode(json).buffer as ArrayBuffer;
  }

  private deserializeMetrics(buffer: ArrayBuffer): Metrics {
    const decoder = new TextDecoder();
    const json = decoder.decode(buffer);
    return JSON.parse(json) as Metrics;
  }
}
