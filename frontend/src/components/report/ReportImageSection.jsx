import React from "react";

function ReportImageSection({
  selectedImage,
  handleImageUpload,
  fileInputRef,
  errors,
  sectionRefs,
  setState,
}) {
  return (
    <section
      ref={sectionRefs.bukti}
      className="bg-white rounded-[24px] border border-[#E7ECF3] p-8 mb-6 shadow-sm"
    >

      <div className="flex items-start gap-4 mb-8">

        <div className="w-12 h-12 rounded-2xl bg-[#EDF6FF] flex items-center justify-center text-[#5B9BD5]">
          <i className="fas fa-camera text-lg"></i>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#102348] mb-1">
            Bukti Visual
          </h2>

          <p className="text-sm text-gray-500">
            Sertakan foto yang jelas untuk meningkatkan identifikasi.
          </p>
        </div>

      </div>

      <div
        className={`
          border-2 border-dashed rounded-[24px]
          py-16 flex flex-col items-center justify-center
          text-center bg-[#FAFBFD]

          ${
            errors.selectedImage
              ? "border-red-500"
              : "border-[#D8E1EE]"
          }
        `}
      >

        {!selectedImage ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[#EDF4FF] flex items-center justify-center text-[#1B4D9B] mb-5">
              <i className="fas fa-cloud-upload-alt text-2xl"></i>
            </div>

            <h3 className="font-bold text-[#102348] mb-2">
              Unggah Foto Disini
            </h3>

            <p className="text-xs text-gray-400 mb-6">
              PNG, JPG, atau JPEG (max. 10MB)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="upload-image"
            />

            <label
              htmlFor="upload-image"
              className="
                bg-[#163A70]
                hover:bg-[#0F2D58]
                text-white
                px-6
                py-3
                rounded-xl
                text-sm
                font-semibold
                transition-all
                cursor-pointer
              "
            >
              Cari Dokumen
            </label>

            {errors.selectedImage && (
              <p className="text-red-500 text-xs mt-4">
                Bukti visual wajib diisi
              </p>
            )}
          </>
        ) : (
          <>
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Preview"
              className="
                w-64
                rounded-2xl
                border
                border-gray-200
                shadow-sm
                object-cover
              "
            />

            <button
              onClick={() => {

                setState({
                  selectedImage: null,
                  errors: {
                    selectedImage: "Bukti visual wajib diisi",
                  },
                });

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="
                mt-5
                bg-red-100
                text-red-600
                px-5
                py-3
                rounded-xl
                text-sm
                font-semibold
                hover:bg-red-200
                transition-all
                flex
                items-center
                gap-2
              "
            >
              <i className="fas fa-trash-alt"></i>
              Hapus Foto
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default ReportImageSection;