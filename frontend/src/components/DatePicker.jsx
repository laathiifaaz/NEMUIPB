import React from "react";

const Datepicker = ({
  value,
  onChange,
  error,
  inputRef,
  name = "tanggal_kejadian",
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={value}
        max={today}
        onChange={onChange}
        onFocus={(e) => e.target.showPicker()}
        className={`
          w-full
          rounded-xl
          border
          px-4
          py-4
          outline-none
          transition-all
          bg-[#F5F7FB]
          text-[#102348]
          pr-12
          appearance-none
          
          
          ${
            error
              ? "border-red-500"
              : "border-[#E4EAF2]"
          }

          focus:ring-4
          focus:ring-blue-100
          focus:border-[#1B4D9B]
        `}
        style={{
            colorScheme: "light",
            }}
      />

      <i className="
            fas fa-calendar-alt
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-[#102348]
            pointer-events-none
        "></i>

      {/* ICON */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1B4D9B] pointer-events-none">
        <i className="fas fa-calendar-alt"></i>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">
          Wajib diisi
        </p>
      )}
    </div>
  );
};

export default Datepicker;