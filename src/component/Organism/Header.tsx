import cx from "classnames";
import * as React from "react";
import { IconContext } from "react-icons";
import { AiFillSetting, AiOutlineUpload, AiOutlineSun, AiFillMoon } from "react-icons/ai";
import { Logo } from "../Atom";

export const Header: React.FC<{
  fixed?: boolean;
  dark?: boolean;
  onClickLogo?: () => void;
  onClickDarkMode?: (b: boolean) => void;
  onClickMenuItem?: (key: PageKey) => void;
}> = (props) => {
  return (
    <IconContext.Provider value={{ className: "dark:text-gray-200 text-3xl" }}>
      <div className={cx("flex items-center gap-3 px-3 pt-1", props.fixed && ["fixed"])}>
        <Logo className="flex-1" onClick={props.onClickLogo} />
        {props.dark ? (
          <AiOutlineSun onClick={() => props.onClickDarkMode?.(false)} />
        ) : (
          <AiFillMoon onClick={() => props.onClickDarkMode?.(true)} />
        )}
        <AiOutlineUpload onClick={() => props.onClickMenuItem?.("upload")} />
        <AiFillSetting onClick={() => props.onClickMenuItem?.("config")} />
      </div>
    </IconContext.Provider>
  );
};
