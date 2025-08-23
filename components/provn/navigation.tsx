"use client";

import { useState, useEffect } from "react";
import {
  CampButton,
  CampModal,
  useAuth,
  useAuthState,
  useModal,
} from "@campnetwork/origin/react";
import { Menu, X, Wallet, User, Users } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CreateProfileModal } from "./create-profile-modal";
import { useProfile } from "@/hooks/useProfile";

interface NavigationProps {
  currentPage?:
    | "home"
    | "upload"
    | "dashboard"
    | "video"
    | "provs"
    | "profile"
    | "explore"
    | "communities";
}

// Custom Provn Logo Component
const ProvnLogo = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <motion.div
      className="flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        {/* Logo Icon */}
        <div className="w-8 h-8 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-provn-bg rounded-sm transform rotate-12"></div>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-8 h-8 bg-provn-accent/20 rounded-lg blur-sm"></div>
      </div>

      {/* Logo Text */}
      <div className="font-headline font-bold">
        <span className="text-2xl text-provn-text">Prov</span>
        <span className="text-2xl text-provn-accent">n</span>
        <div
          className={`h-0.5 bg-gradient-to-r from-provn-accent to-transparent transition-all duration-300 ${
            isScrolled ? "w-8" : "w-12"
          }`}
        ></div>
      </div>
    </motion.div>
  );
};


export function Navigation({ currentPage }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const { scrollY } = useScroll();
  const { isAuthenticated, walletAddress } = useAuth();
  const { authenticated } = useAuthState();
  const { openModal, closeModal } = useModal();
  const { profile, loading, error } = useProfile(walletAddress || undefined);
  
  // Debug modal state
  useEffect(() => {
    console.log("🔍 Navigation: Modal hooks initialized:", { openModal, closeModal });
  }, [openModal, closeModal]);
  
  // Debug authentication state
  useEffect(() => {
    console.log("🔍 Navigation: Auth state:", { 
      isAuthenticated, 
      authenticated, 
      walletAddress,
      hasOpenModal: typeof openModal === 'function',
      hasCloseModal: typeof closeModal === 'function'
    });
  }, [isAuthenticated, authenticated, walletAddress, openModal, closeModal]);
  
  useEffect(() => {
    console.log("🔍 Navigation: Wallet address:", authenticated);
  }, [authenticated]);
  // Debug logging
  useEffect(() => {
    console.log("🔍 Navigation: Profile state:", {
      walletAddress,
      profile,
      loading,
      error,
      hasProfile: !!profile,
    });

    // Debug: Check if profile API is working
    if (walletAddress && !profile && !loading) {
      console.log("🔍 Navigation: Testing profile API directly...");
      fetch(`/api/profile/${walletAddress}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("🔍 Navigation: Direct API test result:", data);
        })
        .catch((err) => {
          console.error("🔍 Navigation: Direct API test error:", err);
        });
    }
  }, [walletAddress, profile, loading, error]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  return (
    <>
      <motion.nav
        style={{ opacity: navOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-provn-bg/80 backdrop-blur-xl border-b border-provn-border/50 shadow-lg shadow-provn-bg/20"
            : "bg-transparent"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <a
                href="/"
                className="focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg rounded-lg p-1"
                aria-label="Provn - Go to homepage"
              >
                <ProvnLogo isScrolled={isScrolled} />
              </a>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              className="hidden md:flex items-center gap-8 font-headline"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <NavLink 
                href={isAuthenticated && profile ? "/explore" : "#"} 
                currentPage={currentPage} 
                page="explore"
                onClick={!isAuthenticated || !profile ? (e) => {
                  e?.preventDefault()
                  if (!isAuthenticated) {
                    openModal()
                  } else if (!profile) {
                    setShowCreateProfile(true)
                  }
                } : undefined}
                disabled={!isAuthenticated || !profile}
              >
                Explore
              </NavLink>
              <NavLink 
                href={isAuthenticated && profile ? "/upload" : "#"} 
                currentPage={currentPage} 
                page="upload"
                onClick={!isAuthenticated || !profile ? (e) => {
                  e?.preventDefault()
                  if (!isAuthenticated) {
                    openModal()
                  } else if (!profile) {
                    setShowCreateProfile(true)
                  }
                } : undefined}
                disabled={!isAuthenticated || !profile}
              >
                Create
              </NavLink>
              <NavLink
                href={isAuthenticated && profile ? "/dashboard" : "#"}
                currentPage={currentPage}
                page="dashboard"
                onClick={!isAuthenticated || !profile ? (e) => {
                  e?.preventDefault()
                  if (!isAuthenticated) {
                    openModal()
                  } else if (!profile) {
                    setShowCreateProfile(true)
                  }
                } : undefined}
                disabled={!isAuthenticated || !profile}
              >
                Leaderboard
              </NavLink>
              
              <NavLink
                href={isAuthenticated && profile ? "/communities" : "#"}
                currentPage={currentPage}
                page="communities"
                onClick={!isAuthenticated || !profile ? (e) => {
                  e?.preventDefault()
                  if (!isAuthenticated) {
                    openModal()
                  } else if (!profile) {
                    setShowCreateProfile(true)
                  }
                } : undefined}
                disabled={!isAuthenticated || !profile}
              >
                Communities
              </NavLink>

              {/* Profile and Connect Wallet */}
              {isAuthenticated ? (
                <>
                  <motion.button
                    onClick={() => {
                      console.log('🎯 Navigation: View Profile clicked', { profile: profile?.handle })
                      if (profile) {
                        // Navigate to profile page instead of opening modal
                        window.location.href = `/u/${profile.handle}`;
                      } else {
                        // No profile, show create profile modal
                        setShowCreateProfile(true);
                      }
                    }}
                    className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 text-provn-muted hover:text-provn-text hover:bg-provn-surface/30 flex items-center gap-2 font-headline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="w-4 h-4" />
                    {profile ? "View Profile" : "Create Profile"}
                  </motion.button>
                  <motion.button
                    onClick={openModal}
                    className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 text-provn-muted hover:text-provn-text hover:bg-provn-surface/30 flex items-center gap-2 font-headline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Wallet className="w-4 h-4" />
                    {walletAddress
                      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                          -4
                        )}`
                      : "Wallet"}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={openModal}
                  className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 text-provn-muted hover:text-provn-text hover:bg-provn-surface/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </motion.button>
              )}
            </motion.div>
            {/* Mobile menu button */}
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl text-provn-muted hover:text-provn-text hover:bg-provn-surface/50 focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg transition-all duration-200 ${
                  isScrolled ? "bg-provn-surface/30" : ""
                }`}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </motion.div>
          </div>
        </div>
        {/* CampModal for wallet connection */}
        <div className="hidden">
  <CampModal />
</div>        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? "open" : "closed"}
          variants={{
            open: {
              opacity: 1,
              height: "auto",
              y: 0,
            },
            closed: {
              opacity: 0,
              height: 0,
              y: -10,
            },
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden bg-provn-bg/95 backdrop-blur-xl border-t border-provn-border/50"
          id="mobile-menu"
        >
          <div className="px-4 py-6 space-y-4">
            <MobileNavLink 
              href={isAuthenticated && profile ? "/explore" : "#"} 
              onClick={!isAuthenticated || !profile ? (e) => {
                e?.preventDefault()
                if (!isAuthenticated) {
                  openModal()
                } else if (!profile) {
                  setShowCreateProfile(true)
                }
                setIsMenuOpen(false)
              } : () => setIsMenuOpen(false)}
              disabled={!isAuthenticated || !profile}
            >
              Explore Provs
            </MobileNavLink>
            <MobileNavLink 
              href={isAuthenticated && profile ? "/upload" : "#"} 
              onClick={!isAuthenticated || !profile ? (e) => {
                e?.preventDefault()
                if (!isAuthenticated) {
                  openModal()
                } else if (!profile) {
                  setShowCreateProfile(true)
                }
                setIsMenuOpen(false)
              } : () => setIsMenuOpen(false)}
              disabled={!isAuthenticated || !profile}
            >
              Create Content
            </MobileNavLink>
            <MobileNavLink
              href={isAuthenticated && profile ? "/dashboard" : "#"}
              onClick={!isAuthenticated || !profile ? (e) => {
                e?.preventDefault()
                if (!isAuthenticated) {
                  openModal()
                } else if (!profile) {
                  setShowCreateProfile(true)
                }
                setIsMenuOpen(false)
              } : () => setIsMenuOpen(false)}
              disabled={!isAuthenticated || !profile}
            >
              Leaderboard
            </MobileNavLink>
            
            <MobileNavLink
              href={isAuthenticated && profile ? "/communities" : "#"}
              onClick={!isAuthenticated || !profile ? (e) => {
                e?.preventDefault()
                if (!isAuthenticated) {
                  openModal()
                } else if (!profile) {
                  setShowCreateProfile(true)
                }
                setIsMenuOpen(false)
              } : () => setIsMenuOpen(false)}
              disabled={!isAuthenticated || !profile}
            >
              Communities
            </MobileNavLink>

            {/* Mobile Wallet Connection */}
            <div className="pt-4 border-t border-provn-border/30 font-headline">
              {authenticated ? (
                <>
                  <motion.button
                    onClick={() => {
                      console.log('🎯 Mobile Navigation: View Profile clicked', { profile: profile?.handle })
                      if (profile) {
                        // Navigate to profile page instead of opening modal
                        window.location.href = `/u/${profile.handle}`;
                      } else {
                        // No profile, show create profile modal
                        setShowCreateProfile(true);
                      }
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-provn-surface/50 border border-provn-border/50 w-full text-left mb-3 font-headline"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-10 h-10 bg-provn-accent rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-provn-bg" />
                    </div>
                    <div>
                      <div className="font-medium text-provn-text">
                        {profile ? "View Profile" : "Create Profile"}
                      </div>
                      <div className="text-sm text-provn-muted">
                        {walletAddress
                          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                              -4
                            )}`
                          : "Wallet"}
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Wallet Management Button */}
                  <motion.button
                    onClick={() => {
                      console.log("🔍 Mobile: Opening wallet management modal");
                      try {
                        openModal();
                        setIsMenuOpen(false);
                      } catch (error) {
                        console.error("🔍 Mobile: Error opening wallet modal:", error);
                        // Fallback: try to show modal directly
                        console.log("🔍 Mobile: Trying fallback modal approach");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-provn-surface/30 border border-provn-border/30 text-provn-muted hover:bg-provn-surface/50 hover:border-provn-border/50 hover:text-provn-text transition-all duration-200 cursor-pointer font-headline"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Wallet className="w-4 h-4" />
                    Manage Wallet
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={() => {
                    console.log("🔍 Mobile: Opening connect wallet modal");
                    openModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-provn-surface/50 border border-provn-border/50 text-provn-text hover:bg-provn-surface hover:border-provn-border transition-all duration-200 cursor-pointer font-headline"
                  whileTap={{ scale: 0.98 }}
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </motion.button>
              )}
              
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSuccess={(handle) => {
          setShowCreateProfile(false);
          // Navigate to the new profile
          window.location.href = `/u/${handle}`;
        }}
      />

    </>
  );
}

// Desktop Navigation Link Component
const NavLink = ({
  href,
  children,
  currentPage,
  page,
  onClick,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  currentPage?: string;
  page: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) => {
  const isActive = currentPage === page;

  return (
    <motion.a
      href={disabled ? "#" : href}
      onClick={onClick}
      className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        disabled
          ? "text-provn-muted/50 cursor-not-allowed"
          : isActive
            ? "text-provn-accent bg-provn-accent/10"
            : "text-provn-muted hover:text-provn-text hover:bg-provn-surface/30"
      }`}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled}
    >
      {children}
      {!disabled && (
        <>
          {/* Lock icon for disabled state */}
          {disabled && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-provn-muted/30 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 border border-provn-muted/50 rounded-full"></div>
            </div>
          )}
          {isActive && (
            <motion.div
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-provn-accent rounded-full"
              layoutId="activeNavIndicator"
            />
          )}
        </>
      )}
    </motion.a>
  );
};

// Mobile Navigation Link Component
const MobileNavLink = ({
  href,
  children,
  onClick,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  onClick: (e?: React.MouseEvent) => void;
  disabled?: boolean;
}) => {
  return (
    <motion.a
      href={disabled ? "#" : href}
      onClick={onClick}
      className={`block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
        disabled
          ? "text-provn-muted/50 cursor-not-allowed"
          : "text-provn-text hover:text-provn-accent hover:bg-provn-surface/30"
      }`}
      whileTap={disabled ? {} : { scale: 0.98 }}
      aria-disabled={disabled}
    >
      {children}
    </motion.a>
  );
};
