declare module 'dom-to-image-more' {
  interface Options {
    quality?: number;
    pixelRatio?: number;
    width?: number;
    height?: number;
    bgcolor?: string;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    style?: Partial<CSSStyleDeclaration>;
    filter?: (node: Node) => boolean;
  }

  const domToImage: {
    toPng: (node: HTMLElement, options?: Options) => Promise<string>;
    toJpeg: (node: HTMLElement, options?: Options) => Promise<string>;
    toSvg: (node: HTMLElement, options?: Options) => Promise<string>;
    toPixelData: (node: HTMLElement, options?: Options) => Promise<Uint8ClampedArray>;
    toCanvas: (node: HTMLElement, options?: Options) => Promise<HTMLCanvasElement>;
    toBlob: (node: HTMLElement, options?: Options) => Promise<Blob>;
  };

  export default domToImage;
}
