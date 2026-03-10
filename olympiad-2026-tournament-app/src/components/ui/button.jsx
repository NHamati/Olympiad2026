import React from "react";

export function Button({
  children,
  onClick,
  variant = "default",
  className = "",
  style = {},
  type = "button",
}) {
  const baseStyle = {
    borderRadius: "14px",
    padding: "10px 14px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  const variantStyle =
    variant === "outline"
      ? {
          background: "#ffffff",
          borderColor: "#d1d5db",
          color: "#111827",
        }
      : {
          background: "#3c5644",
          color: "#ffffff",
        };

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      style={{ ...baseStyle, ...variantStyle, ...style }}
    >
      {children}
    </button>
  );
}
