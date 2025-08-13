import React from "react";
import { CopySVG } from "../utils/icons";
import { toast } from "sonner";

interface CopyButtonProps {
  value: string;
  className?: string;
  color?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, className, color }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <button
      type="button"
      className={`hover:bg-[#FF6D0120] hover:text-[#FF6D01] hover:cursor-pointer transition-colors duration-150 rounded p-1 ${
        className || ""
      }`}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      <CopySVG color={color} />
    </button>
  );
};

export default CopyButton;
