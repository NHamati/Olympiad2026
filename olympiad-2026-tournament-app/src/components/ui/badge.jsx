import React from "react";

export function Badge({ children, className = "", style = {} }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        padding: "6px 10px",
        fontSize: "12px",
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
