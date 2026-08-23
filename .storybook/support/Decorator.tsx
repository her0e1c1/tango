import type * as React from "react";

export const Container: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="container mx-auto">{children}</div>
);
