import React from "react";

export function Card({ className = "", style, children }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", style, children }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", style, children }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", style, children }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
