import React, { useState } from 'react';
import { useAuth } from "@campnetwork/origin/react";
import type { Address } from "viem/accounts";
import { toast } from "sonner";
import { uploadToIPFS } from '../utils/upload';

interface MintButtonProps {
  image: File | null;
  address: string | undefined;
  ipName?: string;
  ipDescription?: string;
}

type LicenseTerms = {
  price: bigint;
  duration: number;
  royaltyBps: number;
  paymentToken: Address;
};

export default function MintButton({ 
  image, 
  address, 
  ipName = "My IP NFT",
  ipDescription = "Uploaded via Origin SDK"
}: MintButtonProps) {
  const auth = useAuth();
  const { origin } = auth;
  const [isRegistering, setIsRegistering] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegisterIP = async () => {
    if (!image || !address || !origin) {
      toast.error("Missing required data for registration");
      return;
    }

    // Check if wallet is connected
    if (!auth.walletAddress) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet first.",
        duration: 5000,
      });
      return;
    }
    console.log("Wallet connected:", auth.walletAddress);

    // Check if Origin is properly initialized
    if (!origin) {
      toast.error("Origin SDK not initialized", {
        description: "Please try reconnecting your wallet.",
        duration: 5000,
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      let ipfsUrl = "";
      try {
        ipfsUrl = await uploadToIPFS(image);
      } catch (error) {
        return; 
      }

      console.log("Fetching file from IPFS:", ipfsUrl);
      const response = await fetch(ipfsUrl);
      const blob = await response.blob();
      const file = new File([blob], image.name, { type: image.type });

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        toast.error("File too large for registration.", {
          description: `File size is ${fileSizeMB.toFixed(2)}MB. Maximum allowed is 10MB.`,
          duration: 5000,
        });
        return;
      }

      // Define license terms
      const license = {
        price: BigInt(0),
        duration: 2629800, // 30 days in seconds
        royaltyBps: 0,
        paymentToken: "0x0000000000000000000000000000000000000000" as Address,
      } as LicenseTerms;

      // Create metadata
      const metadata = {
        name: ipName,
        description: ipDescription,
        image: ipfsUrl,
        attributes: [
          {
            trait_type: "Type",
            value: "Image",
          },
          {
            trait_type: "File Size",
            value: `2MB`,
          },
        ],
      };

      console.log("Starting IP registration...", {
        fileSize: fileSizeMB.toFixed(2) + "MB",
        walletAddress: address,
        hasOrigin: !!origin,
        fileName: file.name,
        fileType: file.type
      });

      // Register IP using Origin SDK
      const result = await origin.mintFile(file, metadata, license);
      setSuccess(result);
 
      toast.success("IP registration successful! Your NFT is now live.", {
        duration: 5000,
      });
      console.log("IP registration successful! Your NFT is now live.");

      
    } catch (error) {
      console.error("IP registration failed:", error);
      
      // Provide specific error messages
      let errorMessage = "IP registration failed. Please try again later.";
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
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="w-full">
      <button
        disabled={!image || !address || isRegistering || !ipName?.trim()}
        onClick={handleRegisterIP}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
      >
        {isRegistering ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isRegistering ? "Registering IP..." : "Minting..."}
          </div>
        ) : (
          "Register IP"
        )}
      </button>
      
      {/* Transaction Hash Display */}
      {success && (
        <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">IP registration successful! Your NFT is now live.</span>
          </div>
        </div>
      )}
    </div>
  );
} 