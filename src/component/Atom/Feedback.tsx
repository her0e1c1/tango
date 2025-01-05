import * as React from "react";

export const Feedback: React.FC<{ children: React.ReactNode }> = (props) =>
  props.children == null ? (
    <></>
  ) : (
    <div className="fixed left-0 right-0 bottom-36 flex justify-center">
      <div className="w-8 h-8 rounded-full bg-gray-600 flex justify-center items-center bg-opacity-50 font-semibold">
        {props.children}
      </div>
    </div>
  );
