import React from "react";
import agencyLogo from "../assets/images/agency-logo.png";
export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-4 px-4 sm:px-6 lg:px-8 border-t border-black bg-white/50 backdrop-blur-md transition-colors duration-300 w-full no-print">
      {" "}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        {" "}
        {/* Left Side (Sisi Kiri Pojok Bawah) */}{" "}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-black">
          {" "}
          <span>&copy; 2026 Kakami. All rights reserved.</span>{" "}
        </div>{" "}
        {/* Right Side */}{" "}
        <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black">
          {" "}
          <img
            src={agencyLogo}
            alt="Agency Logo"
            className="h-[20px] sm:h-[24px] w-auto opacity-80 hover:opacity-100 transition-opacity"
          />{" "}
        </div>{" "}
      </div>{" "}
    </footer>
  );
};
