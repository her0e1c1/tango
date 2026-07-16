import type * as React from "react";
import { AiOutlineCloudDownload } from "react-icons/ai";
import { Upload, Description, Code, Title } from "@/shared/components";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";

export const DeckImportTemplate: React.FC<{
  onChange?: (file: File) => void;
  onDownloadSample?: () => void;
  sampleText: string;
  layout?: LayoutProps;
  pending?: boolean;
  feedbackSlot?: React.ReactNode;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.feedbackSlot}
      <Title>Deck Upload</Title>
      <Upload
        className="my-2"
        {...(props.pending !== undefined ? { disabled: props.pending } : {})}
        {...(props.onChange !== undefined ? { onChange: props.onChange } : {})}
      />
      <Title>CSV File Format</Title>
      <Description className="my-2">{`There are 3 columns without header: front text, back text, and tags (optional).`}</Description>
      <div className="flex justify-start items-center">
        <Title>CSV Sample</Title>
        <button
          type="button"
          aria-label="Download CSV sample"
          className="flex items-center cursor-pointer"
          onClick={props.onDownloadSample}
        >
          <AiOutlineCloudDownload className="text-xl" size={24} />
          <Description className="m-1 underline">{`download`}</Description>
        </button>
      </div>
      <div className="overflow-scroll p-1 mt-2 shadow dark:shadow-gray-100">
        <Code text={props.sampleText} category="csv" />
      </div>
    </Layout>
  );
};
