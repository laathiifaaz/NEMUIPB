// src/components/report/ReportHeader.jsx

import React from "react";
import FormStep from "../FormStep";

const ReportHeader = ({
  formData,
  selectedImage,
  sectionRefs,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6 mb-6 shadow-sm">

      <div className="flex justify-between items-center mb-5">

        <div>

          <h1 className="text-4xl font-extrabold text-[#0B1F44] mb-2">
            Pelaporan Kehilangan Barang
          </h1>

          <p className="text-gray-500 text-sm max-w-3xl leading-relaxed">
            Kejujuran Anda membantu menjaga integritas komunitas kami.
            Mohon berikan deskripsi yang lengkap untuk membantu
            mengembalikan barang ini kepada pemilik yang sebenarnya.
          </p>

        </div>

      </div>

      {/* STEP */}
      <div className="flex items-center justify-between mt-8 text-[11px] font-semibold uppercase tracking-wide">

        <FormStep
          title="Detail Barang"
          completed={
            formData.nama_barang &&
            formData.kategori &&
            formData.deskripsi
          }
          onClick={() =>
            sectionRefs.detail.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />

        <FormStep
          title="Lokasi Kehilangan"
          className="px-2"
          completed={
            formData.lokasi &&
            formData.tanggal_kejadian
          }
          onClick={() =>
            sectionRefs.lokasi.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />

        <FormStep
          title="Bukti Visual"
          className="px-2"
          completed={selectedImage}
          onClick={() =>
            sectionRefs.bukti.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />

        <FormStep
          title="Konfirmasi"
          completed={
            formData.nama_barang &&
            formData.kategori &&
            formData.deskripsi &&
            formData.lokasi &&
            formData.tanggal_kejadian &&
            selectedImage
          }
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
        />

      </div>

    </div>
  );
};

export default ReportHeader;