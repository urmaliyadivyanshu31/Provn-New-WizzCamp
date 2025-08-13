import React, { useState } from "react";
import { InfoSVG } from "../utils/icons";

interface LabeledInputProps {
  type: string;
  label: string;
  placeholder?: string;
  infoText?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  type,
  label,
  placeholder,
  infoText,
  disabled = false,
  value,
  onChange = () => {},
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  return (
    <div className="relative mb-6">
      <label
        className={`block mb-1 font-medium  ${
          disabled ? "text-gray-400" : "text-gray-800"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          className={`w-full pr-10 pl-3 py-2 bg-[#E8E5E3] border rounded text-base transition focus:outline-none focus:ring-2 focus:ring-blue-400
            ${
              disabled
                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                : "border-gray-300"
            }
          `}
        />
        {infoText && (
          <span
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-blue-500 text-lg select-none px-1 z-10
              `}
          >
            <InfoSVG />
            {isHovered && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-[#4C4536] text-white px-3 py-2 rounded shadow-lg text-xs whitespace-nowrap z-20 animate-fade-in">
                {infoText}
              </div>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default LabeledInput;
