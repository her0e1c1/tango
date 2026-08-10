export { actAsync } from "./act";

const NativeBlob = Blob;

export const createBlobConstructor = (blob: Blob): typeof Blob =>
  new Proxy(NativeBlob, {
    construct: () => blob,
  });
