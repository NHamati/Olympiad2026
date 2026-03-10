import React, { createContext, useContext, useMemo, useState } from "react";

const TabsContext = createContext(null);

export function Tabs({ defaultValue, className = "", children }) {
  const [value, setValue] = useState(defaultValue);
  const contextValue = useMemo(() => ({ value, setValue }), [value]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "", style = {} }) {
  return (
    <div className={className} style={{ display: "grid", ...style }}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "", style = {} }) {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => context?.setValue(value)}
      className={className}
      style={{
        borderRadius: "12px",
        border: "none",
        padding: "10px 12px",
        cursor: "pointer",
        fontWeight: 700,
        background: isActive ? "#3c5644" : "transparent",
        color: isActive ? "#ffffff" : style.color || "#3c5644",
      }}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;
  return <div className={className}>{children}</div>;
}
