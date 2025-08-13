import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

export const CONTRACT_ADDRESS = "0xF90733b9eCDa3b49C250B2C3E3E42c96fC93324E";

export const truncate = (str: string, frontLen = 6, backLen = 4): string => {
    if (!str || str.length <= frontLen + backLen + 3) return str;
    return `${str.slice(0, frontLen)}...${str.slice(-backLen)}`;
  };

  export const checkProfanity = (text: string): boolean => {
    const matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });
  
    const hasProfanity = matcher.hasMatch(text);
  
    return hasProfanity;
  };

  export const generateProvider = async (account: any) => {
    if (!account || !account.connector) return null;
  
    const prov = await account.connector.getProvider();
  
    return {
      provider: prov || null,
      info: {
        name:
          account.connector.name ||
          account.connector.paraDetails?.name ||
          "Unknown Wallet",
        icon:
          account.connector.icon ||
          account.connector.paraDetails?.iconUrl ||
          null,
      },
      exclusive: true,
    };
  };

  export async function copyImageToClipboard(imageUrl: string) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
  
    const imgBitmap = await createImageBitmap(blob);
  
    const canvas = document.createElement("canvas");
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
  
    ctx.drawImage(imgBitmap, 0, 0);
  
    const pngBlob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
  
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngBlob }),
    ]);
  }

export const sanitize = (input: string): string => {
    return input
      .trim()
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ");
  };