import type React from "react";
import AnimatedSquaresBackground from "@/components/ui/AnimatedSquares";

interface InteractiveBackgroundLayoutProps {
  children: React.ReactNode;
}

export default function InteractiveBackgroundLayout({
  children,
}: InteractiveBackgroundLayoutProps) {
  return (
    <div className="relative grid h-full w-full grid-cols-1 grid-rows-1">
      {/* Grid Item 1: The Background */}
      <div className="col-start-1 row-start-1">
        <AnimatedSquaresBackground />
      </div>

      {/* Grid Item 2: The Content Wrapper */}
      {/* ADD `pointer-events-none` HERE */}
      <div className="pointer-events-none relative z-10 col-start-1 row-start-1 flex h-full flex-col">
        {children}
      </div>
    </div>
  );
}