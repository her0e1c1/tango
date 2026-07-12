import * as React from "react";

export const Section: React.FC<{ title: string; page?: boolean }> = (props) =>
  props.page ? (
    <div className="mt-4 font-bold text-lg mb-2">{props.title}</div>
  ) : (
    <div className="mt-2 font-light text-lg mb-2 border-b border-gray-200 text-gray-300">{props.title}</div>
  );
