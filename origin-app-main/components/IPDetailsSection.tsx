import React, { useState } from "react";
import { toast } from "sonner";
import { Header, Description } from "../src/components/shared";
import { useAuth } from "@campnetwork/origin/react";
import type { Address } from "viem/accounts";
import { Button } from "./Button";
import Section from "./Section";
import { checkProfanity, sanitize } from "../utils/utils";

interface IPDetailsSectionProps {
  uploadedFile: File | null;
  setSectionIndex: (index: number) => void;
}

type LicenseTerms = {
    price: bigint;
    duration: number;
    royaltyBps: number;
    paymentToken: Address;
  };

const IPDetailsSection: React.FC<IPDetailsSectionProps> = ({
  uploadedFile,
  setSectionIndex,
}) => {
  const auth = useAuth();
  const { origin } = auth;  
  const [ipName, setIpName] = useState("");
  const [ipDescription, setIpDescription] = useState("");

  const handleContinue = async () => {
    if (!ipName.trim()) {
      toast.error("Please enter an IP name", {
        description: "IP name is required to continue.",
      });
      return;
    }

    if (!ipDescription.trim()) {
      toast.error("Please enter an IP description", {
        description: "IP description is required to continue.",
      });
      return;
    }

    // Check for profanity in IP name
    if (checkProfanity(ipName)) {
      toast.error("Please enter a valid name for your IP.", {
        description: "The name contains profanity or invalid characters.",
        duration: 5000,
      });
      return;
    }

    // Check for profanity in IP description
    if (checkProfanity(ipDescription)) {
      toast.error("Please enter a valid description for your IP.", {
        description: "The description contains profanity or invalid characters.",
        duration: 5000,
      });
      return;
    }

    // Check if Origin is properly initialized
    if (!origin) {
      toast.error("Origin is not initialized. Please try reconnecting your wallet.", {
        description: "Make sure you're properly authenticated with Origin.",
        duration: 5000,
      });
      return;
    }

    if (!auth.walletAddress) {
      toast.error("No wallet connected. Please connect your wallet first.", {
        description: "You need to connect a wallet to mint.",
        duration: 5000,
      });
      return;
    }

    if (!uploadedFile) {
      toast.error("No file uploaded. Please upload a file first.", {
        description: "You need to upload a file to continue.",
        duration: 5000,
      });
      return;
    }

    const sanitized = sanitize(ipName);

    // Create a proper file object like the working sample
    const ipfsFile = new File([uploadedFile], uploadedFile.name, { 
      type: uploadedFile.type 
    });
    // Upload file to IPFS
    let url = "";
    try {
      const formData = new FormData();
      formData.append('file', ipfsFile);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
        },
        body: formData
      });

      const result = await response.json();
      url = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
  

      if (!url) {
        throw new Error("Failed to get IPFS URL after upload");
      }

      toast.success("File uploaded to IPFS successfully!", {
        description: `IPFS URL: ${url}`,
      });

    } catch (error) {
      console.error("IPFS upload error:", error);
      toast.error("Failed to upload file to IPFS", {
        description: "There was an error uploading your file. Please try again.",
        duration: 5000,
      });
      return;
    }

    const response = await fetch(url);
    const blob = await response.blob();

    const file = new File([blob], `remix.png`, { 
      type: 'image/png' 
    });

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) { // 10MB limit
      toast.error("File too large for minting.", {
        description: `File size is ${fileSizeMB.toFixed(2)}MB. Maximum allowed is 10MB.`,
        duration: 5000,
      });
      return;
    }

    const license = {
        price: 0n,
        duration: 2629800, // 30 days in seconds
        royaltyBps: 0,
        paymentToken: "0x0000000000000000000000000000000000000000" as Address,
      } as LicenseTerms;

    // Create metadata similar to working sample
    const metadata = {
        name: sanitized || "Untitled Remix",
        description: `A unique image remix created by mAItrix`,
        image: url,
        attributes: [
          {
            trait_type: "Base Character",
            value: "Unknown",
          },
          {
            trait_type: "Type",
            value: "Image",
          },
        ],
      };

    setSectionIndex(3); 
    
    try {
      console.log("Starting mint process...", {
        fileSize: fileSizeMB.toFixed(2) + "MB",
        walletAddress: auth.walletAddress,
        hasOrigin: !!origin,
        fileName: file.name,
        fileType: file.type
      });

  


      await origin.mintFile(file, metadata, license);

      setSectionIndex(6); // final section after minting
      toast.success(`Minting successful! Your IP NFT is now live.`, {
        duration: 5000,
      });
      
    } catch (error) {
      console.error("Minting failed:", error);
      
      // Provide more specific error messages
      let errorMessage = "Minting failed. Please try again later.";
      let errorDescription = error instanceof Error ? error.message : "An error occurred";
      
      if (errorDescription.includes("signature") || errorDescription.includes("Failed to get signature")) {
        errorMessage = "Transaction signature failed.";
        errorDescription = "Please check your wallet connection and approve the transaction when prompted.";
      } else if (errorDescription.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
        errorDescription = "Make sure you're connected to the correct network.";
      } else if (errorDescription.includes("gas")) {
        errorMessage = "Insufficient gas fees.";
        errorDescription = "Please ensure you have enough gas for the transaction.";
      } else if (errorDescription.includes("user rejected") || errorDescription.includes("User rejected")) {
        errorMessage = "Transaction was rejected.";
        errorDescription = "You declined the transaction. Please try again and approve when prompted.";
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });

      setSectionIndex(2); // stay on the same section to retry
    }
  };

  const handleBack = () => {
    setSectionIndex(1); // Go back to file upload section
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Section className="max-w-lg">
      <Header text="IP Details" label="Step 3" />
      <Description text="Provide details about your intellectual property." />
      
      {/* File Summary */}
      {uploadedFile && (
        <div className="w-full mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">
            Uploaded File
          </div>
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {uploadedFile.type.startsWith('image/') ? '🖼️' : 
                 uploadedFile.type.startsWith('audio/') ? '🎵' :
                 uploadedFile.type.startsWith('video/') ? '🎬' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* IP Name Input */}
      <div className="w-full mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          IP Name *
        </label>
        <input
          type="text"
          value={ipName}
          onChange={(e) => setIpName(e.target.value)}
          placeholder="Enter your IP name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          maxLength={100}
        />
      </div>

      {/* IP Description Input */}
      <div className="w-full mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          IP Description *
        </label>
        <textarea
          value={ipDescription}
          onChange={(e) => setIpDescription(e.target.value)}
          placeholder="Describe your intellectual property"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {ipDescription.length}/500 characters
        </div>
      </div>
      
      <div className="flex gap-2 w-full justify-between">
        <Button
          onClick={handleBack}
          text="Back"
          className="w-1/3"
          justifyContent="center"
          arrow="left"
        />
        <Button
          onClick={handleContinue}
          text="Continue"
          className="w-1/3"
          justifyContent="center"
          arrow="right"
          disabled={!ipName.trim() || !ipDescription.trim()}
        />
      </div>
    </Section>
  );
};

export default IPDetailsSection;
