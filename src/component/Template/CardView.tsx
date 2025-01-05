import * as React from "react";
import * as Organism from "../Organism";

export const CardView: React.FC<{
  layout?: LayoutProps;
  backText?: BackTextProps;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      {props.backText != null && <Organism.BackText {...props.backText} />}
    </Organism.Layout>
  );
};
