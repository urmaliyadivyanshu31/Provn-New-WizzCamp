import { CampModal, useAuthState, useModal } from "@campnetwork/origin/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheckIcon } from "lucide-react";

export default function CampAuth() {
  const { authenticated } = useAuthState();
  const { openModal } = useModal();

  const handleConnectWallet = async () => {
    try {
      await openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!authenticated) {
    return (
      <div className="w-full">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-orange-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please connect your wallet to upload and mint your memories as IP-NFTs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleConnectWallet}>
              <CampModal/>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Camp Network & Wallet Connected
          </span>
        </div>
      </div>
    </div>
  );
}