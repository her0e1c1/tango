import type React from "react";

export const Form: React.FC<{ div?: boolean; onSubmit?: () => void; children?: React.ReactNode }> = (props) => {
  const { div, ...rest } = props;
  const Tag = div ? "div" : "form";
  return <Tag className="w-full space-y-4 px-3 text-ink" {...rest} />;
};
