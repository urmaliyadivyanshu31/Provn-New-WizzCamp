import { toast } from "sonner";

export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN}`
      },
      body: formData
    });

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    if (!ipfsUrl) {
      throw new Error("Failed to get IPFS URL after upload");
    }

    toast.success("File uploaded to IPFS successfully!", {
      description: `IPFS URL: ${ipfsUrl}`,
    });

    return ipfsUrl;
  } catch (error) {
    console.error("IPFS upload error:", error);
    toast.error("Failed to upload file to IPFS", {
      description: "There was an error uploading your file. Please try again.",
      duration: 5000,
    });
    throw error;
  }
} 