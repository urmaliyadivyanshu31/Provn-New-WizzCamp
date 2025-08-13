import { ArrowSVG } from "../utils/icons";

export const Button = ({
  text,
  onClick,
  className,
  arrow,
  icon,
  disabled = false,
  justifyContent = "center",
  alignSelf = "left",
  inverted = false,
}: {
  text: string;
  onClick: () => void;
  className?: string;
  arrow?: "left" | "right";
  icon?: React.ReactNode;
  disabled?: boolean;
  justifyContent?: "between" | "center";
  alignSelf?: "left" | "right";
  inverted?: boolean;
}) => {
  const alignClass = alignSelf === "right" ? "self-end" : "self-start";
  const contentJustifyClass =
    justifyContent === "between" ? "justify-between" : "justify-center";

  const baseColor = inverted
    ? "bg-transparent border-1 border-[#FF6D01] text-[#FF6D01] hover:bg-[#FF6D01] hover:text-white"
    : "bg-[#FF6D01] text-white hover:bg-orange-600";

  return (
    <button
      onClick={onClick}
      className={`button group relative flex ${contentJustifyClass} items-center gap-2 px-5 py-3 ${baseColor} ${alignClass} ${className} hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={disabled}
    >
      <span
        className={`absolute top-1 left-1 w-1 h-1 ${
          inverted ? "bg-[#FF6D01]/25 group-hover:bg-white/25" : "bg-white/25"
        }`}
      />
      <span
        className={`absolute top-1 right-1 w-1 h-1 ${
          inverted ? "bg-[#FF6D01]/25 group-hover:bg-white/25" : "bg-white/25"
        }`}
      />
      <span
        className={`absolute bottom-1 left-1 w-1 h-1 ${
          inverted ? "bg-[#FF6D01]/25 group-hover:bg-white/25" : "bg-white/25"
        }`}
      />
      <span
        className={`absolute bottom-1 right-1 w-1 h-1 ${
          inverted ? "bg-[#FF6D01]/25 group-hover:bg-white/25" : "bg-white/25"
        }`}
      />

      {arrow === "left" && (
        <span className="transition-colors duration-200 text-[inherit] group-hover:text-white">
          <ArrowSVG color="currentColor" orientation="left" />
        </span>
      )}
      <span className="relative z-10 flex items-center justify-center text-center">
        {text}
      </span>
      {arrow === "right" && (
        <span className="transition-colors duration-200 text-[inherit] group-hover:text-white">
          <ArrowSVG color="currentColor" orientation="right" />
        </span>
      )}
      {icon && (
        <span className="transition-colors duration-200 text-[inherit] group-hover:text-white">
          {icon}
        </span>
      )}
    </button>
  );
};
