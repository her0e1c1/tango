import cx from "classnames";
import * as React from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";

export const Upload: React.FC<{ className?: string; onChange?: (file: File) => void }> = (props) => (
  <label
    className={cx(props.className, "flex", "max-w-sm", "h-48", "rounded-lg", "border", "cursor-pointer", "shadow-lg")}
  >
    <div className={cx("relative", "flex-1", "cursor-pointer")}>
      <div className={cx("absolute", "justify-center", "items-center", "w-full", "h-full", "flex", "flex-col")}>
        <AiOutlineCloudUpload size={24} className="text-xl" />
        <span className="text-base tracking-wide">Upload a csv file</span>
      </div>
      <input
        type="file"
        className="h-full w-full opacity-0 bg-pink-800"
        accept=".csv"
        onChange={(e) => {
          if (e.target.files != null) {
            const file = e.target.files[0];
            if (file != null) {
              props.onChange?.(file);
            }
          }
        }}
      />
    </div>
  </label>
);
