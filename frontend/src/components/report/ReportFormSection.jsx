import React from "react";
import DatePicker from "../DatePicker";

const ReportFormSection = ({
  formData,
  errors,
  selectedImage,
  inputRefs,
  sectionRefs,
  fileInputRef,
  handleChange,
  handleImageUpload,
  setState,
  validateForm,
  handleSubmit,
}) => {
  return (
    <>

      {/* DETAIL BARANG */}
      <section
        ref={sectionRefs.detail}
        className="bg-white rounded-[24px] border border-[#E7ECF3] p-8 mb-6 shadow-sm"
      >

        <div className="flex items-start gap-4 mb-8">

          <div className="w-12 h-12 rounded-2xl bg-[#EDF4FF] flex items-center justify-center text-[#1B4D9B]">
            <i className="fas fa-box text-lg"></i>
          </div>

          <div>

            <h2 className="text-xl font-bold text-[#102348] mb-1">
              Detail Barang
            </h2>

            <p className="text-sm text-gray-500">
              Informasi penting tentang barang yang hilang.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* NAMA BARANG */}
          <div>

            <label className="font-semibold text-[#102348]">
              Nama Barang <span className="text-red-500">*</span>
            </label>

            <input
              ref={inputRefs.nama_barang}
              type="text"
              name="nama_barang"
              value={formData.nama_barang}
              onChange={handleChange}
              placeholder="Masukkan nama barang"
              className={`
                w-full
                rounded-xl
                border
                px-4
                py-4
                outline-none
                transition-all
                bg-[#F5F7FB]

                ${
                  errors.nama_barang
                    ? "border-red-500"
                    : "border-[#E4EAF2]"
                }
              `}
            />

            {errors.nama_barang && (
              <p className="text-red-500 text-xs mt-2">
                Wajib diisi
              </p>
            )}

          </div>

          {/* KATEGORI */}
          <div>

            <label className="font-semibold text-[#102348]">
              Kategori <span className="text-red-500">*</span>
            </label>

            <select
              ref={inputRefs.kategori}
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              className={`
                w-full
                rounded-xl
                border
                px-4
                py-4
                outline-none
                transition-all
                bg-[#F5F7FB]

                ${
                  errors.kategori
                    ? "border-red-500"
                    : "border-[#E4EAF2]"
                }
              `}
            >

              <option value="">
                Pilih kategori
              </option>

              <option value="Elektronik">
                Elektronik
              </option>

              <option value="Aksesoris">
                Aksesoris
              </option>

              <option value="Dokumen">
                Dokumen
              </option>

              <option value="Lainnya">
                Lainnya
              </option>

            </select>

            {errors.kategori && (
              <p className="text-red-500 text-xs mt-2">
                Wajib diisi
              </p>
            )}

          </div>

        </div>

        {/* DESKRIPSI */}
        <div>

          <label className="font-semibold text-[#102348]">
            Deskripsi Barang <span className="text-red-500">*</span>
          </label>

          <textarea
            ref={inputRefs.deskripsi}
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleChange}
            rows="5"
            placeholder="Jelaskan ciri-ciri barang..."
            className={`
              w-full
              rounded-xl
              border
              px-4
              py-4
              outline-none
              transition-all
              bg-[#F5F7FB]

              ${
                errors.deskripsi
                  ? "border-red-500"
                  : "border-[#E4EAF2]"
              }
            `}
          />

          {errors.deskripsi && (
            <p className="text-red-500 text-xs mt-2">
              Wajib diisi
            </p>
          )}

        </div>

      </section>

      {/* LOKASI */}
      <section
        ref={sectionRefs.lokasi}
        className="bg-white rounded-[24px] border border-[#E7ECF3] p-8 mb-6 shadow-sm"
      >

        <div className="flex items-start gap-4 mb-8">

          <div className="w-12 h-12 rounded-2xl bg-[#FFF5D8] flex items-center justify-center text-[#C89B00]">
            <i className="fas fa-map-marker-alt text-lg"></i>
          </div>

          <div>

            <h2 className="text-xl font-bold text-[#102348] mb-1">
              Lokasi & Waktu
            </h2>

            <p className="text-sm text-gray-500">
              Bantu kami menentukan dimana dan kapan ditemukan.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">

          {/* LOKASI */}
          <div>

            <label className="font-semibold text-[#102348]">
              Lokasi Kehilangan <span className="text-red-500">*</span>
            </label>

            <input
              ref={inputRefs.lokasi}
              type="text"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              placeholder="contoh : FMIPA IPB"
              className={`
                w-full
                rounded-xl
                border
                px-4
                py-4
                outline-none
                transition-all
                bg-[#F5F7FB]

                ${
                  errors.lokasi
                    ? "border-red-500"
                    : "border-[#E4EAF2]"
                }
              `}
            />

            {errors.lokasi && (
              <p className="text-red-500 text-xs mt-2">
                Wajib diisi
              </p>
            )}

          </div>

          {/* TANGGAL */}
          <div>

            <label className="font-semibold text-[#102348]">
              Tanggal Kehilangan <span className="text-red-500">*</span>
            </label>

            <DatePicker
              inputRef={inputRefs.tanggal_kejadian}
              name="tanggal_kejadian"
              value={formData.tanggal_kejadian}
              onChange={handleChange}
              error={errors.tanggal_kejadian}
            />

          </div>

        </div>

      </section>

      {/* FOTO */}
      <section
        ref={sectionRefs.bukti}
        className={`
          bg-white
          rounded-[24px]
          border
          p-8
          mb-6
          shadow-sm
          transition-all

          ${
            errors.selectedImage
              ? "border-red-500"
              : "border-[#E7ECF3]"
          }
        `}
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

        {/* AREA UPLOAD */}
        <div className="border-2 border-dashed border-[#D8E1EE] rounded-[24px] py-16 flex flex-col items-center justify-center text-center bg-[#FAFBFD]">

          {/* BELUM ADA FOTO */}
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
                <p className="text-red-500 text-xs mt-5">
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
                      ...errors,
                      selectedImage: "Wajib diisi",
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

      {/* PELAPOR */}
      <section className="bg-white rounded-[24px] border border-[#E7ECF3] p-8 mb-6 shadow-sm">

        <div className="bg-[#FFF9EA] border border-[#F5E7B5] rounded-2xl p-5 flex items-start gap-4 text-sm text-gray-600 leading-relaxed">

          <i className="fas fa-shield-alt text-[#C89B00] mt-1"></i>

          <p>
            Dengan mengirimkan formulir ini, Anda menyatakan bahwa
            informasi kehilangan barang yang diberikan adalah benar dan
            dapat dipertanggungjawabkan.
          </p>

        </div>

      </section>

      {/* FOOTER BUTTON */}
      <div className="flex items-center justify-between px-2 py-6">

        <button
          onClick={() =>
            setState({
              showCancelModal: true,
            })
          }
          className="text-[#1B4D9B] font-semibold flex items-center gap-2 hover:underline"
        >
          <i className="fas fa-arrow-left"></i>
          Kembali ke Beranda
        </button>

        <div className="flex gap-4">

          <button
            onClick={() => {

              const valid = validateForm();

              if (!valid) {

                setState({
                  showErrorModal: true,
                });

                return;
              }

              setState({
                showSubmitModal: true,
              });
            }}
            className="bg-[#163A70] hover:bg-[#0F2D58] text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-100"
          >
            Kirim Laporan
          </button>

        </div>

      </div>

    </>
  );
};

export default ReportFormSection;