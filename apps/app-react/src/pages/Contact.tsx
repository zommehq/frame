import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { useFrameSDK } from "@zomme/fragment-frame-react";

export default function Contact() {
  const { emit } = useFrameSDK();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage("Message sent successfully! (This is a demo)");
    setSubmitSuccess(true);

    emit("contact-form-submitted", {
      ...formData,
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      setSubmitMessage("");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  return (
    <PageLayout
      title="Contact Us"
      subtitle="Get in touch with questions or feedback about the React micro-frontend"
    >
      <div className="content-grid">
        <div className="grid-item">
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              padding: "2rem",
              border: "1px solid var(--border-color)",
            }}
          >
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "2rem",
              }}
            >
              Have questions about our React micro-frontend? Fill out the form below and we'll get
              back to you.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="name"
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="email"
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="subject"
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  htmlFor="message"
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message here..."
                  required
                  rows={6}
                  className="form-input"
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: "#61dafb",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "0.875rem 1.5rem",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#21a1c4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#61dafb";
                }}
              >
                Send Message
              </button>
            </form>

            {submitMessage && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  borderRadius: "4px",
                  backgroundColor: submitSuccess ? "#f0fdf4" : "#f0f9ff",
                  borderLeft: `4px solid ${submitSuccess ? "#61dafb" : "#3b82f6"}`,
                  color: submitSuccess ? "#166534" : "#1e40af",
                }}
              >
                {submitMessage}
              </div>
            )}
          </div>
        </div>

        <div
          className="grid-item"
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <h2 style={{ color: "#2c3e50", fontSize: "1.5rem" }}>
            Other Ways to Reach Us
          </h2>

          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3
              style={{
                color: "#61dafb",
                fontSize: "1.125rem",
                marginBottom: "0.5rem",
              }}
            >
              Email
            </h3>
            <p style={{ color: "#666", margin: 0 }}>support@react-microapp.com</p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3
              style={{
                color: "#61dafb",
                fontSize: "1.125rem",
                marginBottom: "0.5rem",
              }}
            >
              Documentation
            </h3>
            <p style={{ color: "#666", margin: 0 }}>
              Visit our docs for detailed guides
            </p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3
              style={{
                color: "#61dafb",
                fontSize: "1.125rem",
                marginBottom: "0.5rem",
              }}
            >
              GitHub
            </h3>
            <p style={{ color: "#666", margin: 0 }}>
              Check out our open source repository
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
