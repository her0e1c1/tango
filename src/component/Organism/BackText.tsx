import * as React from "react";
import { Math, Code, Style } from "../Atom";
import * as C from "src/constant"


export const BackText: React.FC<BackTextProps> = (props) => {
  return (
    <Style div className="h-full w-full p-5" onClick={props.onClick}>
      {props.category === "math" ? (
        <Math text={props.text} />
      ) : C.LANGUAGES.includes(props.category ?? "") ? (
        <Code text={props.text} category={props.category ?? ""} />
      ) : (
        <pre>{props.text}</pre>
      )}
      <div className="h-10" />
    </Style>
  );
};
