import React from "react";

export function Table({ children }) {
  return <table>{children}</table>;
}

export function TableHeader({ children }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, style = {}, className = "" }) {
  return (
    <tr className={className} style={style}>
      {children}
    </tr>
  );
}

export function TableHead({ children, style = {}, className = "" }) {
  return (
    <th
      className={className}
      style={{
        textAlign: "left",
        padding: "12px 10px",
        fontSize: "14px",
        fontWeight: 700,
        borderBottom: "1px solid #dde5d7",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, style = {}, className = "" }) {
  return (
    <td
      className={className}
      style={{
        padding: "12px 10px",
        borderBottom: "1px solid #dde5d7",
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
