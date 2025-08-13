import React from "react";
import { toast } from "sonner";
import { Header, Description } from "../src/components/shared";
import { Button } from "./Button";
import Section from "./Section";
import { useAuth } from "@campnetwork/origin/react";
import { useBalance } from "wagmi";
import { parseEther } from "viem";

const WelcomeSection = ({
  wallet,
  authenticated,
  openCampModal,
  openModal,
  disconnect,
  setSectionIndex,
}: {
  wallet: any;
  authenticated: boolean;
  openCampModal: () => void;
  openModal: () => void;
  disconnect: () => void;
  setSectionIndex: (index: number) => void;
}) => {
  const auth = useAuth();
  const { data: balance, isLoading: isLoadingBalance } = useBalance({
    address: wallet?.address,
  });

  const hasEnoughCamp = balance ? balance.value > parseEther("0.01") : false;

  const handleClick = async () => {
    if (wallet?.address) {
      if (authenticated) {
          if (!auth.viem) {
            toast.error("Wallet not connected to Origin", {
              description: "Please try disconnecting Origin and reconnecting.",
            });
            return;
          } else {
            if (!hasEnoughCamp && !isLoadingBalance) {
              toast.error("Insufficient balance to mint a generation.", {
                description:
                  "Please ensure you have enough more than 0.01 $CAMP in your wallet.",
              });
              return;
            }
            const walletAddress = wallet.address;
            const originWalletAddress = auth.walletAddress as string;

            if (
              walletAddress.toLowerCase() !== originWalletAddress.toLowerCase()
            ) {
              toast.error("Wallet address mismatch. Please try again.", {
                description:
                  "Ensure you connected the same wallet to Origin. Try disconnecting and reconnecting Origin.",
              });
              return;
            }
            setSectionIndex(1);
          }
      } else {
        openCampModal();
      }
    } else {
      openModal();
    }
  };

  return (
    <Section className="max-w-md">
      <Header text="Welcome to Camp" />
      <div className="text-[#4C4536] text-md text-center">
        {wallet?.address ? (
          authenticated ? (
            <Description text="Welcome back! Ready to upload your file?" />
          ) : (
            <Description text="One more step, authenticate with Origin" />
          )
        ) : (
          <Description text="Please connect your wallet" />
        )}
      </div>
      
      <Button
        onClick={handleClick}
        text={
          wallet?.address
            ? authenticated && auth.viem
                ? "Upload File"
              : "Origin Auth"
            : "Connect Wallet"
        }
        className={"w-full"}
        arrow={undefined}
        justifyContent="center"
      />
      {authenticated && (
        <Button
          onClick={() => disconnect()}
          text="Disconnect Origin"
          className={"w-full"}
        />
      )}

      {!hasEnoughCamp && !isLoadingBalance && wallet?.address && (
        <div className="w-full text-center mt-2">
          <span className="text-[12px] text-[#807359] line-clamp-2">
            You need at least <strong>0.01 $CAMP</strong> in your wallet to mint
            a generation.
          </span>
          <Button
            onClick={() => {
              window.open("https://faucet.campnetwork.xyz", "_blank");
            }}
            text="Get $CAMP"
            className={"w-full mt-2"}
            justifyContent="center"
          />
        </div>
      )}
    </Section>
  );
};

export default WelcomeSection;
