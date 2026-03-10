import React from "react";

export function Input({ className = "", style = {}, ...props }) {
  return (
    <input
      {...props}
      className={className}
      style={{
        width: "100%",
        minHeight: "40px",
        borderRadius: "12px",
        border: "1px solid #d1d5db",
        padding: "8px 12px",
        outline: "none",
        ...style,
      }}
    />
  );
}
