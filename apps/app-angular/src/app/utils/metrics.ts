import type { Metrics } from "../models/types";

export function serializeMetrics(metrics: Metrics): ArrayBuffer {
  const encoder = new TextEncoder();
  const json = JSON.stringify(metrics);
  const uint8Array = encoder.encode(json);
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(buffer).set(uint8Array);
  return buffer;
}

export function deserializeMetrics(buffer: ArrayBuffer): Metrics {
  const decoder = new TextDecoder();
  const json = decoder.decode(buffer);
  return JSON.parse(json);
}

export function calculateMetrics(
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
