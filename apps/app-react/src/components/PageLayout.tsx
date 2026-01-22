import type { CSSProperties, ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  subtitle?: string;
  title: string;
}

export function PageLayout({ children, subtitle, title }: PageLayoutProps) {
  const styles: Record<string, CSSProperties> = {
    pageLayout: {
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      marginBottom: "2rem",
    },
    title: {
      margin: 0,
      fontSize: "2rem",
      color: "#1a1a1a",
    },
    subtitle: {
      margin: "0.5rem 0 0",
      color: "#666",
      fontSize: "0.875rem",
    },
    content: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
  };

  return (
    <div style={styles.pageLayout}>
      <div style={styles.header}>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>

      <div style={styles.content}>{children}</div>
    </div>
  );
}
