"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProvnButton } from "@/components/provn/button";
import { ProvnCard, ProvnCardContent } from "@/components/provn/card";
import { Mail, CheckCircle, AlertCircle, Loader, Wallet } from "lucide-react";
import {
  useAuth,
  useModal,
  useConnect,
  CampModal,
} from "@campnetwork/origin/react";
import { useRouter } from "next/navigation";

interface SubmissionResult {
  success: boolean;
  message: string;
  type?: "email" | "x" | "wallet";
}

interface WalletAuthResult {
  success: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  accessType?: "authorized" | "whitelisted" | "none";
  message?: string;
  error?: string;
}

export default function WhitelistPage() {
  const [activeTab, setActiveTab] = useState<"wallet" | "email" | "x">(
    "wallet"
  );
  const [email, setEmail] = useState("");
  const [emailWalletAddress, setEmailWalletAddress] = useState("");
  const [twitterUsername, setTwitterUsername] = useState("");
  const [twitterWalletAddress, setTwitterWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Origin SDK auth
  const { walletAddress, isAuthenticated } = useAuth();
  const { openModal } = useModal();
  const { disconnect } = useConnect();
  const router = useRouter();

  // Reset state when wallet changes
  useEffect(() => {
    if (walletAddress) {
      console.log("👛 Wallet connected:", walletAddress);
      setIsRedirecting(false);
      setSubmissionResult(null);
    }
  }, [walletAddress]);

  // Handle URL parameters from Twitter auth redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const success = urlParams.get("success");
    const message = urlParams.get("message");
    const username = urlParams.get("username");

    if (error === "twitter_auth_failed" && message) {
      setSubmissionResult({
        success: false,
        message: decodeURIComponent(message),
        type: "x",
      });
      // Clean up URL
      window.history.replaceState({}, "", "/whitelist");
    } else if (success === "twitter_submitted" && username) {
      setSubmissionResult({
        success: true,
        message: `Twitter account @${username} successfully submitted for review! We'll notify you when access is approved.`,
        type: "x",
      });
      // Clean up URL
      window.history.replaceState({}, "", "/whitelist");
    }
  }, []);

  const handleWalletAuth = async () => {
    if (!walletAddress || isRedirecting) return;

    console.log("🔐 Checking wallet access for:", walletAddress);
    setIsCheckingWallet(true);

    try {
      const response = await fetch("/api/whitelist/wallet-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      const result: WalletAuthResult = await response.json();

      if (result.success && result.hasAccess) {
        console.log("✅ Wallet has access! Setting cookie and redirecting...");
        setIsRedirecting(true);

        setSubmissionResult({
          success: true,
          message: "Access granted! Redirecting to platform...",
          type: "wallet",
        });

        // Set wallet cookie for middleware (with proper security settings)
        document.cookie = `wallet_address=${walletAddress}; path=/; max-age=86400; SameSite=Lax; Secure=${
          location.protocol === "https:"
        }`;

        // Simple redirect without complex countdown
        setTimeout(() => {
          window.location.href = "/";
        }, 1500); // Give user time to see success message
      } else {
        setSubmissionResult({
          success: false,
          message:
            result.message ||
            "This wallet is not whitelisted. Please use email or X to request access.",
          type: "wallet",
        });
      }
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: "Failed to verify wallet access. Please try again.",
        type: "wallet",
      });
    } finally {
      setIsCheckingWallet(false);
    }
  };

  const handleWalletConnect = () => {
    try {
      openModal();
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: "Failed to open wallet connection. Please try again.",
        type: "wallet",
      });
    }
  };

  const handleWalletDisconnect = () => {
    try {
      disconnect();
      setSubmissionResult(null);
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: "Failed to disconnect wallet. Please try again.",
        type: "wallet",
      });
    }
  };

  const handleManualWalletCheck = () => {
    console.log("🖱️ Manual wallet check requested");
    handleWalletAuth();
  };

  const handleEmailSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      setSubmissionResult({
        success: false,
        message: "Please enter a valid email address",
      });
      return;
    }

    if (!emailWalletAddress || !isValidWalletAddress(emailWalletAddress)) {
      setSubmissionResult({
        success: false,
        message: "Please enter a valid wallet address",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/whitelist/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "email",
          email: email.toLowerCase().trim(),
          walletAddress: emailWalletAddress.toLowerCase().trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmissionResult({
          success: true,
          message:
            "Request submitted successfully. We'll notify you when access is available.",
          type: "email",
        });
        setEmail("");
        setEmailWalletAddress("");
      } else {
        setSubmissionResult({
          success: false,
          message: result.error || "Submission failed. Please try again.",
        });
      }
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleXAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!twitterUsername || !isValidTwitterUsername(twitterUsername)) {
      setSubmissionResult({
        success: false,
        message: "Please enter a valid Twitter username",
        type: "x",
      });
      return;
    }

    if (!twitterWalletAddress || !isValidWalletAddress(twitterWalletAddress)) {
      setSubmissionResult({
        success: false,
        message: "Please enter a valid wallet address",
        type: "x",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      console.log("🐦 Verifying Twitter username:", twitterUsername);

      const response = await fetch("/api/auth/x/simple-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: twitterUsername.replace(/^@/, ""),
          walletAddress: twitterWalletAddress.toLowerCase().trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmissionResult({
          success: true,
          message: result.message,
          type: "x",
        });
        setTwitterUsername("");
        setTwitterWalletAddress("");
      } else {
        setSubmissionResult({
          success: false,
          message: result.error || "Failed to verify Twitter account",
          type: "x",
        });
      }
    } catch (error: any) {
      console.error("❌ Twitter auth failed:", error);
      setSubmissionResult({
        success: false,
        message: "Network error. Please check your connection and try again.",
        type: "x",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new state for X login
  const [isXAuthenticated, setIsXAuthenticated] = useState(false);
  const [xUser, setXUser] = useState<{ username: string } | null>(null);
  const [isXLoading, setIsXLoading] = useState(false);

  // Handler to start X login (redirect to backend OAuth)
  const handleXLogin = async () => {
    setIsXLoading(true);
    try {
      // 1. Send wallet address to backend before starting X OAuth
      if (!walletAddress || !isValidWalletAddress(walletAddress)) {
        setSubmissionResult({
          success: false,
          message:
            "Please connect a valid wallet address before logging in with X.",
          type: "x",
        });
        setIsXLoading(false);
        return;
      }

      // Store wallet address in DB (optional: you can use a dedicated endpoint)
      const walletRes = await fetch("/api/auth/x/simple-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletAddress.trim(),

          preAuth: true,
        }),
      });
      // You may want to check walletRes, but continue regardless

      // 2. Start X OAuth
      const res = await fetch("/api/auth/x/authorize");
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert(data.error || "Failed to start Twitter login");
        setIsXLoading(false);
      }
    } catch (err) {
      alert("Failed to start Twitter login");
      setIsXLoading(false);
    }
  };

  // Listen for X OAuth callback (username in URL param)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const xAuth = urlParams.get("x_auth");
    const username = urlParams.get("x_username");
    if (xAuth === "success" && username) {
      setIsXAuthenticated(true);
      setXUser({ username });
      setTwitterUsername(username);
      // Clean up URL
      window.history.replaceState({}, "", "/whitelist?tab=x");
    }
  }, []);

  const handleXFinalSubmit = async (e:any) => {
    e.preventDefault();
    // Validate walletAddress
    // POST { username: xUser.username, walletAddress } to /api/auth/x/simple-auth
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidTwitterUsername = (username: string) => {
    const cleanUsername = username.replace(/^@/, "");
    return /^[a-zA-Z0-9_]{1,15}$/.test(cleanUsername);
  };

  const isValidWalletAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Provn Logo Component (same as in navigation)
  const ProvnLogo = () => (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-provn-bg rounded-sm transform rotate-12"></div>
        </div>
        <div className="absolute inset-0 w-8 h-8 bg-provn-accent/20 rounded-lg blur-sm"></div>
      </div>
      <div className="font-headline font-bold">
        <span className="text-2xl text-provn-text">Prov</span>
        <span className="text-2xl text-provn-accent">n</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-provn-bg">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/5 via-transparent to-orange-100/5"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, #ff6d01 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="w-full p-6">
          <ProvnLogo />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            {/* Main Card */}
            <ProvnCard className="bg-provn-surface border border-provn-border shadow-xl">
              <ProvnCardContent className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="font-headline text-3xl font-bold text-provn-text mb-3">
                    Join The Beta
                  </h1>
                  <p className="text-provn-muted">
                    Get exclusive access to Provn's beta platform
                  </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-provn-surface-2 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setActiveTab("wallet")}
                    className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center text-sm ${
                      activeTab === "wallet"
                        ? "bg-provn-accent text-provn-bg shadow-sm"
                        : "text-provn-muted hover:text-provn-text"
                    }`}
                  >
                    <Wallet className="w-4 h-4 mr-1" />
                    Wallet
                  </button>
                  <button
                    onClick={() => setActiveTab("email")}
                    className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center text-sm ${
                      activeTab === "email"
                        ? "bg-provn-accent text-provn-bg shadow-sm"
                        : "text-provn-muted hover:text-provn-text"
                    }`}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </button>
                  <button
                    onClick={() => setActiveTab("x")}
                    className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center text-sm ${
                      activeTab === "x"
                        ? "bg-provn-accent text-provn-bg shadow-sm"
                        : "text-provn-muted hover:text-provn-text"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X
                  </button>
                </div>

                {/* Form Content */}
                <AnimatePresence mode="wait">
                  {activeTab === "wallet" && (
                    <motion.div
                      key="wallet"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="text-center py-4">
                        <Wallet className="w-12 h-12 text-provn-accent mx-auto mb-3" />
                        {!isAuthenticated ? (
                          <>
                            <p className="text-provn-muted text-sm mb-4">
                              Connect your wallet to check for instant access
                            </p>
                            <ProvnButton
                              onClick={handleWalletConnect}
                              className="w-full py-3"
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Connect Wallet
                            </ProvnButton>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-provn-text text-sm font-medium">
                                  Connected Wallet
                                </p>
                                <button
                                  onClick={handleWalletDisconnect}
                                  className="text-xs text-provn-muted hover:text-red-500 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </div>
                              <p className="text-provn-muted text-xs font-mono">
                                {walletAddress?.slice(0, 6)}...
                                {walletAddress?.slice(-4)}
                              </p>
                            </div>

                            {isCheckingWallet ? (
                              <ProvnButton disabled className="w-full py-3">
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Checking Access...
                              </ProvnButton>
                            ) : (
                              <ProvnButton
                                onClick={handleManualWalletCheck}
                                className="w-full py-3"
                                disabled={isRedirecting}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Check Access
                              </ProvnButton>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "email" && (
                    <motion.div
                      key="email"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <form
                        onSubmit={handleEmailSubmission}
                        className="space-y-4"
                      >
                        <div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full px-4 py-3 bg-provn-bg border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-provn-accent transition-all"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={emailWalletAddress}
                            onChange={(e) =>
                              setEmailWalletAddress(e.target.value)
                            }
                            placeholder="Enter your wallet address (0x...)"
                            required
                            className="w-full px-4 py-3 bg-provn-bg border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-provn-accent transition-all font-mono text-sm"
                          />
                        </div>

                        <ProvnButton
                          type="submit"
                          disabled={
                            isSubmitting || !email || !emailWalletAddress
                          }
                          className="w-full py-3"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Request Access"
                          )}
                        </ProvnButton>
                      </form>
                    </motion.div>
                  )}

                  {activeTab === "x" && (
                    <motion.div
                      key="x"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Require wallet connection before X login */}
                      {!walletAddress ? (
                        <div className="space-y-4 text-center">
                          <Wallet className="w-12 h-12 text-provn-accent mx-auto mb-3" />
                          <p className="text-provn-muted text-sm mb-4">
                            Please connect your wallet before logging in with X
                            (Twitter)
                          </p>
                          <ProvnButton
                            onClick={handleWalletConnect}
                            className="w-full py-3"
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            Connect Wallet
                          </ProvnButton>
                        </div>
                      ) : !isXAuthenticated ? (
                        <div className="space-y-4 text-center">
                          <svg
                            className="w-12 h-12 text-provn-accent mx-auto mb-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          <p className="text-provn-muted text-sm mb-4">
                            Login with X (Twitter) to verify your account
                          </p>
                          <p className="text-provn-muted text-sm mb-4">
                            Wallet Address:{" "}
                            <span className="font-mono">
                              {walletAddress.slice(0, 6)}...
                              {walletAddress.slice(-4)}
                            </span>
                            <button
                              onClick={handleWalletDisconnect}
                              className="text-xs text-provn-muted hover:text-red-500 transition-colors ml-2"
                              type="button"
                            >
                              Disconnect
                            </button>
                          </p>

                          <ProvnButton
                            onClick={handleXLogin}
                            className="w-full py-3"
                            disabled={isXLoading}
                          >
                            {isXLoading ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Redirecting...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4 mr-2"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                Login with X
                              </>
                            )}
                          </ProvnButton>
                        </div>
                      ) : (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (
                              !walletAddress ||
                              !isValidWalletAddress(walletAddress)
                            ) {
                              setSubmissionResult({
                                success: false,
                                message:
                                  "Please connect a valid wallet address",
                                type: "x",
                              });
                              return;
                            }
                            setIsSubmitting(true);
                            setSubmissionResult(null);
                            try {
                              const response = await fetch(
                                "/api/auth/x/simple-auth",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    username: xUser?.username,
                                    walletAddress: walletAddress
                                      .toLowerCase()
                                      .trim(),
                                  }),
                                }
                              );
                              const result = await response.json();
                              if (result.success) {
                                setSubmissionResult({
                                  success: true,
                                  message: result.message,
                                  type: "x",
                                });
                              } else {
                                setSubmissionResult({
                                  success: false,
                                  message:
                                    result.error ||
                                    "Failed to verify Twitter account",
                                  type: "x",
                                });
                              }
                            } catch (error) {
                              setSubmissionResult({
                                success: false,
                                message:
                                  "Network error. Please check your connection and try again.",
                                type: "x",
                              });
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div className="text-center py-2">
                            <svg
                              className="w-12 h-12 text-provn-accent mx-auto mb-3"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <p className="text-provn-muted text-sm mb-2">
                              Verified as{" "}
                              <span className="font-bold text-provn-accent">
                                @{xUser?.username}
                              </span>
                            </p>
                            <p className="text-provn-muted text-xs mt-1">
                              Wallet:{" "}
                              <span className="font-mono">{walletAddress}</span>
                            </p>
                          </div>
                          <ProvnButton
                            type="submit"
                            disabled={
                              isSubmitting ||
                              !walletAddress ||
                              !isValidWalletAddress(walletAddress)
                            }
                            className="w-full py-3"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit for Access"
                            )}
                          </ProvnButton>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submission Result */}
                <AnimatePresence>
                  {submissionResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`mt-4 p-3 rounded-lg flex items-start text-sm ${
                        submissionResult.success
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : "bg-red-50 border border-red-200 text-red-700"
                      }`}
                    >
                      {submissionResult.success ? (
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p>{submissionResult.message}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-provn-border">
                  <div className="text-center">
                    <p className="text-xs text-provn-muted">
                      Currently in Q3 beta phase.{" "}
                      <span className="text-provn-text">Limited access.</span>
                    </p>
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="w-full p-6">
          <div className="text-center">
            <p className="text-xs text-provn-muted">
              Powered by{" "}
              <span className="text-provn-accent font-medium">
                Camp Network
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden">
        {/* CampModal for wallet connection */}
        <CampModal />
      </div>
    </div>
  );
}
