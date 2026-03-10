import React from "react";

export function ScrollArea({ children, className = "", style = {} }) {
  return (
    <div className={className} style={{ overflow: "auto", ...style }}>
      {children}
    </div>
  );
}
