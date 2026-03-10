import React from "react";

export function Label({ children, htmlFor, className = "", style = {} }) {
  return (
    <label htmlFor={htmlFor} className={className} style={{ fontWeight: 600, ...style }}>
      {children}
    </label>
  );
}
