import * as React from "react";

export const Container: React.FC<{ children?: React.ReactNode }> = (props) => (
  <div className="container mx-auto">{props.children}</div>
);
