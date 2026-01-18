import { useFrameSDK } from "@zomme/frame-react";
import { useEffect, useState } from "react";

export function DataVisualization() {
  const { props, emit } = useFrameSDK();
  const [data, setData] = useState<number[]>([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });

  useEffect(() => {
    // Receber ArrayBuffer do parent
    if (props.metricsData instanceof ArrayBuffer) {
      const float32 = new Float32Array(props.metricsData);
      const dataArray = Array.from(float32);
      setData(dataArray);

      // Calcular estatísticas
      const min = Math.min(...dataArray);
      const max = Math.max(...dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setStats({ min, max, avg });

      // Notificar parent que dados foram processados
      emit("data-loaded", { count: float32.length, min, max, avg });
    }
  }, [props.metricsData, emit]);

  // Criar e enviar ArrayBuffer para parent
  const sendLargeData = () => {
    const buffer = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      buffer[i] = Math.random() * 100;
    }

    emit("large-data", buffer.buffer); // Transferable!
  };

  return (
    <div
      style={{ padding: "1rem", background: "#f5f5f5", borderRadius: "8px", marginBottom: "1rem" }}
    >
      <h3>Data Visualization (Transferable Objects Demo)</h3>
      <div style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Data points:</strong> {data.length}
        </p>
        <p>
          <strong>Min:</strong> {stats.min.toFixed(2)}
        </p>
        <p>
          <strong>Max:</strong> {stats.max.toFixed(2)}
        </p>
        <p>
          <strong>Average:</strong> {stats.avg.toFixed(2)}
        </p>
      </div>
      <button
        onClick={sendLargeData}
        style={{
          background: "#3498db",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Send Large Data (1000 floats)
      </button>
    </div>
  );
}
