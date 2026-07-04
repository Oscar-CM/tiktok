"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#07070b",
          color: "#f4f4f6",
          fontFamily: "sans-serif",
          gap: "1rem",
        }}
      >
        <h2>Something went wrong</h2>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "9999px",
            background: "linear-gradient(90deg,#8b5cf6,#22d3ee)",
            color: "#07070b",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
