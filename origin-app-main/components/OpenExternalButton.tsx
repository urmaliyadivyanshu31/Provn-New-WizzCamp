import React from "react";
import { OpenExternalSVG } from "../utils/icons";

interface OpenExternalButtonProps {
  url: string;
  className?: string;
  color?: string;
}

const OpenExternalButton: React.FC<OpenExternalButtonProps> = ({ url, className, color }) => {
  const handleOpen = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      className={`hover:bg-[#FF6D0120] hover:text-[#FF6D01] hover:cursor-pointer transition-colors duration-150 rounded p-1 ${className || ""}`}
      onClick={handleOpen}
      title="Open in block explorer"
      style={{ display: "inline-flex", alignItems: "center", color: color || undefined }}
    >
      <OpenExternalSVG color={color} />
    </button>
  );
};

export default OpenExternalButton;
