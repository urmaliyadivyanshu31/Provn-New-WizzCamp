import { motion } from "framer-motion";
import React from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{
        layout: { duration: 0.5, type: "spring" },
        scale: { type: "spring", stiffness: 200, damping: 20 },
        opacity: { duration: 0.3 },
      }}
      className={`bg-[#F7F0E3] flex flex-col sm:p-6 p-4 rounded-2xl shadow-lg text-black justify-center items-center sm:gap-4 gap-2 w-full max-w-2xl mx-auto ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Section;
