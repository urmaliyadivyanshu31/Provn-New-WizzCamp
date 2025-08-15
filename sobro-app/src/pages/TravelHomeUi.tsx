"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "@/components/grants/sidebar";
import MagicBento, { BentoCardProps } from "@/components/ui/MagicBento";
import InteractiveBackgroundLayout from "@/components/layouts/InteractiveComponent";
import {  CampModal, useAuthState, useModal } from "@campnetwork/origin/react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";


export default function TravelChatHome() {
  const [agentMode, setAgentMode] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { authenticated } = useAuthState();
  const { openModal } = useModal();

  const handleConnectWallet = async () => {
    try {
      await openModal();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const navigate = useNavigate();

  const travelcards: BentoCardProps[] = [
    {
      color: "#FFC0CB",
      title: "Barcelona",
      description: "Gaudí, beaches, tapas",
      label: "Places",
      imageUrl:
        "https://www.27vakantiedagen.nl/wp-content/themes/dwi27v/img/pics/spanje/barcelona3.jpg",
    },
    {
      color: "#060010",
      title: "Edinburgh",
      description: "Castles, dramatic landscapes",
      label: "Places",
      imageUrl:
        "https://a.cdn-hotels.com/gdcs/production73/d1723/35b8f7e3-14c4-4d53-ae2f-5f7f6adb6aac.jpg",
    },
    {
      color: "#060010",
      title: "Gold Coast",
      description: "Beautiful now, perfect later",
      label: "Places",
      imageUrl:
        "https://cdn.suwalls.com/wallpapers/world/gold-coast-16171-2880x1800.jpg",
    },
    {
      color: "#060010",
      title: "Tokyo",
      description: "Neon lights, sushi, culture",
      label: "Places",
      imageUrl:
        "https://www.thetraveler.org/content/images/size/w1200/2025/07/Tokyo.webp",
    },
    {
      color: "#060010",
      title: "Santorini",
      description: "White cliffs, blue domes",
      label: "Places",
      imageUrl:
        "https://sothebysrealty.gr/wp-content/uploads/2016/11/Santorini-sunset-at-dawn-Greece-Sothebys-International-Realty.jpg",
    },
    {
      color: "#060010",
      title: "Bali",
      description: "Temples, rice terraces",
      label: "Places",
      imageUrl:
        "https://a.cdn-hotels.com/gdcs/production143/d1112/c4fedab1-4041-4db5-9245-97439472cf2c.jpg",
    },
  ];

  const inspicards: BentoCardProps[] = [
    {
      color: "#060010",
      title: "Mountain Adventures",
      description: "Hiking trails and scenic views",
      label: "Inspiration",
      imageUrl:
        "https://tse1.mm.bing.net/th/id/OIP.cB9ojdzioM1PP4rNR8QzMgHaED?rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      color: "#060010",
      title: "Beach Escapes",
      description: "Sun, sand, relaxation",
      label: "Inspiration",
      imageUrl:
        "https://tse4.mm.bing.net/th/id/OIP.xkVu3f_haXFbc2MuMGYmwQHaEo?rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      color: "#060010",
      title: "City Breaks",
      description: "Urban exploration",
      label: "Inspiration",
      imageUrl:
        "https://res.cloudinary.com/lastminute-contenthub/image/upload/c_limit,h_999999,w_1920/f_auto/q_auto:eco/v1559905602/DAM/Photos/Destinations/Europe/Hungary/Budapest/shutterstock_113183983.jpg",
    },
    {
      color: "#060010",
      title: "Cultural Experiences",
      description: "Museums, history, local traditions",
      label: "Inspiration",
      imageUrl:
        "https://www.zingbus.com/blog/wp-content/uploads/2023/05/Cultural-Immersion-4-2.jpg",
    },
    {
      color: "#060010",
      title: "Food & Wine",
      description: "Culinary journeys",
      label: "Inspiration",
      imageUrl:
        "https://tse1.mm.bing.net/th/id/OIP.ITz-k5rmldlsYRFP4LooCwHaFD?rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      color: "#060010",
      title: "Adventure Sports",
      description: "Thrills and excitement",
      label: "Inspiration",
      imageUrl:
        "https://wallpapers.com/images/hd/extreme-adventure-sports-skydiving-y2p37mkbfcyazyrh.jpg",
    },
  ];

  const sendMessage = () => {
    if (inputValue.trim()) {
      navigate(`/sobro-agent?query=${encodeURIComponent(inputValue)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleCardClick = (title: string) => {
    setInputValue(
      `Plan a trip to ${title} for 4 days, starting from New Delhi.`
    );
    console.log(title);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col bg-gray-950 text-white relative">
        {/* Background Layer - Non-interactive */}
        <div className="absolute inset-0 pointer-events-none">
          <InteractiveBackgroundLayout>
            <div className="w-full h-full" />
          </InteractiveBackgroundLayout>
        </div>

        {/* Content Layer - Interactive */}
        <div className="relative z-10 flex flex-col h-screen">
          {/* Top Bar with Connect Button */}
          <div className="flex w-full items-center justify-end p-4">
            {!authenticated ? (
              <Button
                onClick={handleConnectWallet}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg"
              >
              <CampModal/>
              </Button>
            ) : (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Camp Network Connected
                </span>
              </div>
            )}
          </div>

          {/* Sticky Header with Input */}
          <div className="sticky top-0 z-50 px-6 pb-6 bg-transparent">
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl p-6">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-full border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                  <Zap
                    className={`w-5 h-5 transition-colors ${
                      agentMode ? "text-orange-500" : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm text-gray-300 font-medium">
                    Agent
                  </span>
                  <Switch
                    checked={agentMode}
                    onCheckedChange={setAgentMode}
                    className="scale-90"
                  />
                </div>
                <div className="flex-1 flex gap-3 pointer-events-auto">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about travel..."
                    className="flex-1 min-h-12 max-h-40 bg-gray-800/50 border-gray-700/50 rounded-2xl text-white placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-base px-4 py-3 resize-none overflow-y-auto"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="rounded-2xl h-12 w-12 shrink-0 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-200 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pointer-events-auto">
              <div className="max-w-7xl mx-auto px-6 pb-16">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Trending Destinations
                  </h2>
                  <div className="relative z-20">
                    <MagicBento
                      cards={travelcards}
                      textAutoHide={true}
                      enableStars={true}
                      enableSpotlight={true}
                      enableBorderGlow={true}
                      enableTilt={true}
                      enableMagnetism={true}
                      clickEffect={true}
                      onCardClick={handleCardClick}
                      spotlightRadius={300}
                      particleCount={12}
                      glowColor="132, 0, 255"
                    />
                  </div>
                </div>
                <div className="mb-16">
                  <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Inspiration
                  </h2>
                  <div className="relative z-20">
                    <MagicBento
                      cards={inspicards}
                      textAutoHide={true}
                      enableStars={true}
                      enableSpotlight={true}
                      enableBorderGlow={true}
                      enableTilt={true}
                      enableMagnetism={true}
                      clickEffect={true}
                      onCardClick={handleCardClick}
                      spotlightRadius={300}
                      particleCount={12}
                      glowColor="132, 0, 255"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
