import {  useAuthState } from "@campnetwork/origin/react";
import CampAuth from "./CampAuth";
import ImageUploader from "./ImageUploader";
import Sidebar from "../grants/sidebar";

export default function CampMemories() {
  const { authenticated } = useAuthState();

  return (
    <>
        <div className="flex min-h-screen bg-background">

    <Sidebar/>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Memory Vault</h1>
          <p className="text-muted-foreground text-lg">
            Preserve your precious memories as IP-NFTs on the blockchain
          </p>
        </div>

        {/* Authentication or Upload Section */}
        {!authenticated ? (
          <CampAuth />
        ) : (
          <div className="space-y-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300 font-medium">
                ✅ Connected to Camp Network & Wallet - Ready to upload memories!
              </p>
            </div>
            <ImageUploader />
          </div>
        )}

        {/* Info Section */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-blue-600 dark:text-blue-400 text-xl">🔐</span>
            </div>
            <h3 className="font-semibold">Secure Storage</h3>
            <p className="text-sm text-muted-foreground">
              Your memories are stored on IPFS and protected by blockchain technology
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 dark:text-green-400 text-xl">🎨</span>
            </div>
            <h3 className="font-semibold">IP-NFT Creation</h3>
            <p className="text-sm text-muted-foreground">
              Each memory becomes a unique IP-NFT with customizable licensing terms
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-purple-600 dark:text-purple-400 text-xl">♾️</span>
            </div>
            <h3 className="font-semibold">Forever Preserved</h3>
            <p className="text-sm text-muted-foreground">
              Immutable storage ensures your memories will last forever
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}