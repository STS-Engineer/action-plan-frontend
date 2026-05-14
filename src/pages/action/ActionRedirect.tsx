import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { storeTargetActionId } from "../../utils/actionDeepLink";

export default function ActionRedirect() {
  const { actionId } = useParams();
  const navigate = useNavigate();
  const [showManualFallback, setShowManualFallback] = useState(false);

  useEffect(() => {
    if (actionId) {
      storeTargetActionId(actionId);
    }

    const redirectTimer = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 150);

    const fallbackTimer = window.setTimeout(() => {
      setShowManualFallback(true);
    }, 5000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [actionId, navigate]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f4f6",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            color: "#0f172a",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Opening action from email...
        </h1>

        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          Preparing action #{actionId || "-"} in Action Plan.
        </p>

        {showManualFallback && (
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            style={{
              marginTop: 18,
              border: "none",
              borderRadius: 8,
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 800,
              padding: "12px 16px",
            }}
          >
            Go to Home
          </button>
        )}
      </section>
    </main>
  );
}
