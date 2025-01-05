import * as React from "react";
import { AiOutlineCloudDownload } from "react-icons/ai";
import * as Organism from "../Organism";
import { Upload, Description, Code, Title } from "../Atom";
import * as C from "src/constant";

export const DeckImport: React.FC<{
  onChange?: (file: File) => void;
  onDonloadSample?: () => void;
  layout?: LayoutProps;
}> = (props) => {
  return (
    <Organism.Layout showHeader {...props.layout}>
      <Title>Deck Upload</Title>
      <Upload className="my-2" onChange={props.onChange} />
      <Title>CSV File Format</Title>
      <Description className="my-2">{`There are 3 columns without header: front text, back text, and tags (optional).`}</Description>
      <div className="flex justify-start items-center">
        <Title>CSV Sample</Title>
        <div className="flex items-center cursor-pointer" onClick={props.onDonloadSample}>
          <AiOutlineCloudDownload className="text-xl" size={24} />
          <Description className="m-1 underline">{`download`}</Description>
        </div>
      </div>
      <div className="overflow-scroll p-1 mt-2 shadow dark:shadow-gray-100">
        <Code text={C.CSV_SAMPLE_TEXT} category="csv" />
      </div>
    </Organism.Layout>
  );
};
