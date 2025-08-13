import React from "react";

interface SubHeaderProps {
  text: string;
  className?: string;
}

const SubHeader: React.FC<SubHeaderProps> = ({ text, className = "" }) => {
  return (
    <h3 className={`text-sm font-semibold text-gray-900 mb-2 ${className}`}>
      {text}
    </h3>
  );
};

export default SubHeader; 