import React from "react";

const FormStep = ({
  title,
  completed,
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1
        text-center
        transition-all
        duration-300
        group
        ${className}
      `}
    >
      {/* LINE */}
      <div
        className={`
          h-[3px]
          rounded-full
          mb-2
          transition-all
          duration-300
          ${
            completed
              ? "bg-[#1B4D9B]"
              : "bg-gray-200 group-hover:bg-[#4A6FAE]"
          }
        `}
      ></div>

      {/* TEXT */}
      <span
        className={`
          transition-all
          duration-300
          relative
          ${
            completed
              ? "text-[#1B4D9B]"
              : "text-gray-400 group-hover:text-[#4A6FAE]"
          }
        `}
      >
        {title}
      </span>
    </button>
  );
};

export default FormStep;