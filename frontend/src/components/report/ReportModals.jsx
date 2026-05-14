// src/components/report/ReportModals.jsx

import React from "react";

const ReportModals = ({
  showCancelModal,
  showSubmitModal,
  showErrorModal,
  setState,
  navigate,
  handleSubmit,
}) => {
  return (
    <>

      {/* MODAL BATAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center">

          <div className="bg-white w-[430px] rounded-[28px] p-10 shadow-2xl text-center">

            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#FFE9A9] flex items-center justify-center text-[#D4A017]">
              <i className="fas fa-question text-3xl"></i>
            </div>

            <h2 className="text-3xl font-bold text-black mb-3">
              Batalkan Laporan?
            </h2>

            <p className="text-gray-500 mb-8">
              Laporan yang belum dikirim akan hilang.
            </p>

            <div className="flex gap-4">

              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-[#E9EEF6] text-[#23467A] py-4 rounded-2xl font-bold"
              >
                Ya, Batalkan
              </button>

              <button
                onClick={() =>
                  setState({
                    showCancelModal: false,
                  })
                }
                className="flex-1 bg-[#D93025] text-white py-4 rounded-2xl font-bold"
              >
                Tidak
              </button>

            </div>

          </div>

        </div>
      )}

      {/* MODAL SUBMIT */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center">

          <div className="bg-white w-[430px] rounded-[28px] p-10 shadow-2xl text-center">

            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#FFE9A9] flex items-center justify-center text-[#D4A017]">
              <i className="fas fa-question text-3xl"></i>
            </div>

            <h2 className="text-3xl font-bold text-black mb-3">
              Konfirmasi Laporan?
            </h2>

            <p className="text-gray-500 mb-8">
              Laporan yang dikirim tidak dapat diubah.
            </p>

            <div className="flex gap-4">

              <button
                onClick={() =>
                  setState({
                    showSubmitModal: false,
                  })
                }
                className="flex-1 bg-[#F6DCDC] text-[#C0392B] py-4 rounded-2xl font-bold"
              >
                Tidak
              </button>

              <button
                onClick={handleSubmit}
                className="flex-1 bg-[#163A70] text-white py-4 rounded-2xl font-bold"
              >
                Ya, Kirim
              </button>

            </div>

          </div>

        </div>
      )}

      {/* MODAL ERROR */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center">

          <div className="bg-white w-[420px] rounded-[28px] p-10 shadow-2xl text-center">

            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#FFE5E5] flex items-center justify-center text-[#D93025]">
              <i className="fas fa-exclamation-circle text-3xl"></i>
            </div>

            <h2 className="text-3xl font-bold text-black mb-3">
              Form Belum Lengkap
            </h2>

            <p className="text-gray-500 mb-8">
              Mohon isi semua field yang wajib diisi.
            </p>

            <button
              onClick={() =>
                setState({
                  showErrorModal: false,
                })
              }
              className="w-full bg-[#D93025] text-white py-4 rounded-2xl font-bold"
            >
              Mengerti
            </button>

          </div>

        </div>
      )}

    </>
  );
};

export default ReportModals;