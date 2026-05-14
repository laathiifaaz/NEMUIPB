import React from "react";

const ErrorModal = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-2xl p-6 w-[320px] shadow-xl text-center">

        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
          <i className="fas fa-times text-red-500 text-lg"></i>
        </div>

        <h2 className="text-lg font-bold text-[#002B5B] mb-2">
          Login Gagal
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>

        <button
          onClick={onClose}
          className="bg-[#002B5B] text-white px-6 py-2 rounded-xl hover:bg-[#001a3d] transition"
        >
          Oke
        </button>

      </div>
    </div>
  );
};

export default ErrorModal;