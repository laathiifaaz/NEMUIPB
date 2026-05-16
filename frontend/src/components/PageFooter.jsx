import React from "react";

const PageFooter = ({ className = "mt-16" }) => (
  <footer
    className={`
      ${className}
      border-t border-gray-200 py-8 text-xs text-gray-400
      flex flex-wrap gap-4
    `}
  >
    <span className="font-black text-[#002B5B]">NEMU IPB</span>
    <span>|</span>
    <span>&copy; 2026 IPB University. All rights reserved.</span>
  </footer>
);

export default PageFooter;
