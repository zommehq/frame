import { useFrameSDK } from "@zomme/fragment-frame-react";
import { type CSSProperties, useEffect, useState } from "react";
import type { Metrics } from "../types";
import { calculateMetrics, deserializeMetrics, serializeMetrics } from "../utils/metrics";

interface AnalyticsProps {
  metricsData?: ArrayBuffer;
}

export default function Analytics() {
  const { emit, isReady, props } = useFrameSDK<AnalyticsProps>();

  const [metrics, setMetrics] = useState<Metrics>({
    averageCompletionTime: 0,
    completedToday: 0,
    productivityScore: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
  });

  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (props.metricsData) {
      try {
        const deserializedMetrics = deserializeMetrics(props.metricsData);
        setMetrics(deserializedMetrics);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Failed to deserialize metrics:", error);
        emit("error", {
          component: "Analytics",
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });
      }
    }
  }, [props.metricsData]);

  const generateRandomMetrics = () => {
    setIsLoadingMetrics(true);

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

      setMetrics(newMetrics);
      setLastUpdate(new Date());
      setIsLoadingMetrics(false);

      emit("metrics-generated", {
        metrics: newMetrics,
        timestamp: Date.now(),
      });
    }, 500);
  };

  const sendMetricsToParent = () => {
    try {
      const buffer = serializeMetrics(metrics);

      emit("metrics-transferred", {
        buffer,
        metrics,
        size: buffer.byteLength,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to send metrics:", error);
      emit("error", {
        component: "Analytics",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  };

  const resetMetrics = () => {
    setMetrics({
      averageCompletionTime: 0,
      completedToday: 0,
      productivityScore: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
    });
    setLastUpdate(new Date());

    emit("metrics-reset", {
      timestamp: Date.now(),
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const styles: Record<string, CSSProperties> = {
    analyticsPage: {
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      marginBottom: "2rem",
    },
    headerH1: {
      margin: 0,
      fontSize: "2rem",
      color: "#1a1a1a",
    },
    subtitle: {
      margin: "0.5rem 0 0",
      color: "#666",
      fontSize: "0.875rem",
    },
    loading: {
      padding: "2rem",
      textAlign: "center" as const,
      color: "#666",
    },
    content: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    infoCard: {
      padding: "1.5rem",
      background: "#e0f2fe",
      border: "1px solid #bae6fd",
      borderRadius: "8px",
    },
    infoCardH3: {
      margin: "0 0 0.75rem",
      color: "#0c4a6e",
      fontSize: "1.125rem",
    },
    infoCardP: {
      margin: "0 0 0.5rem",
      color: "#075985",
      lineHeight: 1.6,
    },
    lastUpdate: {
      marginTop: "0.75rem",
      fontSize: "0.875rem",
      fontStyle: "italic" as const,
      color: "#0369a1",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1rem",
    },
    metricCard: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1.5rem",
      background: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    metricIcon: {
      fontSize: "2.5rem",
    },
    metricContent: {
      flex: 1,
    },
    metricLabel: {
      fontSize: "0.875rem",
      color: "#666",
      marginBottom: "0.25rem",
    },
    metricValue: {
      fontSize: "1.75rem",
      fontWeight: 700,
      color: "#1a1a1a",
    },
    productivityCard: {
      padding: "2rem",
      background: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    productivityCardH3: {
      margin: "0 0 1.5rem",
      fontSize: "1.25rem",
      color: "#1a1a1a",
    },
    scoreContainer: {
      display: "flex",
      alignItems: "center",
      gap: "2rem",
    },
    scoreCircle: {
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      border: "8px solid",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f9fafb",
    },
    scoreValue: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    scoreInfo: {
      flex: 1,
    },
    scoreInfoP: {
      margin: 0,
      color: "#666",
      lineHeight: 1.6,
    },
    actions: {
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap" as const,
    },
    actionBtn: {
      padding: "0.875rem 1.5rem",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: 600,
      transition: "all 0.2s",
    },
    actionBtnDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    actionBtnPrimary: {
      background: "#61dafb",
      color: "white",
    },
    actionBtnSecondary: {
      background: "#3b82f6",
      color: "white",
    },
    actionBtnDanger: {
      background: "#ef4444",
      color: "white",
    },
    techDetails: {
      padding: "1.5rem",
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
    },
    techDetailsH4: {
      margin: "0 0 1rem",
      fontSize: "1rem",
      color: "#1a1a1a",
    },
    techDetailsUl: {
      margin: 0,
      paddingLeft: "1.5rem",
      listStyle: "disc",
    },
    techDetailsLi: {
      marginBottom: "0.5rem",
      color: "#666",
      lineHeight: 1.6,
    },
    techDetailsStrong: {
      color: "#1a1a1a",
    },
  };

  if (!isReady) {
    return <div style={styles.loading}>Loading SDK...</div>;
  }

  return (
    <div style={styles.analyticsPage}>
      <div style={styles.header}>
        <h1 style={styles.headerH1}>Analytics Dashboard</h1>
        <p style={styles.subtitle}>Demonstrating Transferable Objects (ArrayBuffer)</p>
      </div>

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <h3 style={styles.infoCardH3}>About Transferable Objects</h3>
          <p style={styles.infoCardP}>
            This page demonstrates the use of <strong>Transferable Objects</strong> with
            ArrayBuffer. Data is serialized to binary format and transferred efficiently between the
            parent and child frames without copying, improving performance for large datasets.
          </p>
          {lastUpdate && (
            <p style={styles.lastUpdate}>Last updated: {lastUpdate.toLocaleTimeString()}</p>
          )}
        </div>

        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>📊</div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Total Tasks</div>
              <div style={styles.metricValue}>{metrics.tasksTotal}</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>✅</div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Completed</div>
              <div style={styles.metricValue}>{metrics.tasksCompleted}</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>🎯</div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Completed Today</div>
              <div style={styles.metricValue}>{metrics.completedToday}</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>⏱️</div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Avg. Time</div>
              <div style={styles.metricValue}>{formatTime(metrics.averageCompletionTime)}</div>
            </div>
          </div>
        </div>

        <div style={styles.productivityCard}>
          <h3 style={styles.productivityCardH3}>Productivity Score</h3>
          <div style={styles.scoreContainer}>
            <div
              style={{
                ...styles.scoreCircle,
                borderColor: getScoreColor(metrics.productivityScore),
              }}
            >
              <span
                style={{
                  ...styles.scoreValue,
                  color: getScoreColor(metrics.productivityScore),
                }}
              >
                {metrics.productivityScore}%
              </span>
            </div>
            <div style={styles.scoreInfo}>
              <p style={styles.scoreInfoP}>
                Your productivity score is based on task completion rate.
                {metrics.productivityScore >= 75 && " Excellent work!"}
                {metrics.productivityScore >= 50 &&
                  metrics.productivityScore < 75 &&
                  " Good progress!"}
                {metrics.productivityScore < 50 && " Keep going!"}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={{
              ...styles.actionBtn,
              ...styles.actionBtnPrimary,
              ...(isLoadingMetrics ? styles.actionBtnDisabled : {}),
            }}
            disabled={isLoadingMetrics}
            onClick={generateRandomMetrics}
          >
            {isLoadingMetrics ? "Generating..." : "Generate Random Metrics"}
          </button>
          <button
            style={{
              ...styles.actionBtn,
              ...styles.actionBtnSecondary,
              ...(isLoadingMetrics ? styles.actionBtnDisabled : {}),
            }}
            disabled={isLoadingMetrics}
            onClick={sendMetricsToParent}
          >
            Send to Parent (ArrayBuffer)
          </button>
          <button
            style={{
              ...styles.actionBtn,
              ...styles.actionBtnDanger,
              ...(isLoadingMetrics ? styles.actionBtnDisabled : {}),
            }}
            disabled={isLoadingMetrics}
            onClick={resetMetrics}
          >
            Reset Metrics
          </button>
        </div>

        <div style={styles.techDetails}>
          <h4 style={styles.techDetailsH4}>Technical Details</h4>
          <ul style={styles.techDetailsUl}>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Serialization:</strong> Metrics are encoded
              to UTF-8 bytes using TextEncoder
            </li>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Transfer:</strong> ArrayBuffer is transferred
              (not copied) via postMessage
            </li>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Performance:</strong> Zero-copy transfer
              improves performance for large data
            </li>
            <li style={styles.techDetailsLi}>
              <strong style={styles.techDetailsStrong}>Buffer Size:</strong> ~
              {Math.ceil(JSON.stringify(metrics).length)} bytes
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
