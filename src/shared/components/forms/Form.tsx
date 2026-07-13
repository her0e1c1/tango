import React from "react";

export const Form: React.FC<{ div?: boolean; onSubmit?: () => void; children?: React.ReactNode }> = (props) => {
  const { div, ...rest } = props;
  const Tag = div ? "div" : "form";
  return <Tag className="px-3" {...rest} />;
};
