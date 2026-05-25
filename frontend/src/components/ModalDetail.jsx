import React, { useState } from "react";

const ModalDetail = ({ data, onClose, navigate }) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const barangId = data?.barang_id || data?.id;
  const canClaim =
    data?.status_barang === "ditemukan" &&
    data?.jenis_laporan === "penemuan" &&
    data?.status_laporan === "disetujui" &&
    data?.status_verifikasi === "terverifikasi";

  if (!data) return null;

  const getImageSrc = (item) => {
    const value =
      item?.foto_url ||
      item?.dokumentasi ||
      item?.img ||
      item?.image ||
      "";

    if (!value) return "/images/logo-ipb.png";
    if (value.startsWith("data:image/")) return value;
    if (value.startsWith("http")) return value;
    if (value.startsWith("/")) return value;

    return `/images/${value}`;
  };

  const formatTanggal = (dateString) => {
    if (!dateString) return "Okt 24, 2025";

    const options = { year: "numeric", month: "short", day: "2-digit" };
    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", options);
  };

  const reportTypeLabel =
    data.jenis_laporan === "kehilangan" ? "Kehilangan" : "Penemuan";
  const dateLabel =
    data.jenis_laporan === "kehilangan" ? "Tanggal Kehilangan" : "Tanggal Penemuan";

  const handleClaim = () => {
    const targetPath = `/klaim/${barangId}`;

    if (navigate) {
      navigate(targetPath);
      return;
    }

    window.history.pushState({}, "", targetPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex justify-center items-center z-[9999] p-5 font-['Plus_Jakarta_Sans']"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1060px] max-h-[92vh] bg-white rounded-[32px] overflow-hidden relative shadow-2xl transition-all"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-4 left-6 z-10 hidden sm:block">
          <span className="text-sm font-bold text-gray-400">Detail</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-6 text-gray-400 hover:text-gray-600 text-xl transition-colors z-20"
          aria-label="Tutup detail barang"
        >
          x
        </button>

        <div className="flex flex-col md:flex-row max-h-[92vh] overflow-y-auto">
          <div className="w-full md:w-[38%] bg-gray-50 flex items-center justify-center overflow-hidden min-h-[260px] md:min-h-[620px]">
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(true)}
              className="w-full h-full cursor-zoom-in"
              aria-label="Perbesar foto barang"
            >
              <img
                src={getImageSrc(data)}
                alt={data.nama_barang || data.nama}
                className="w-full h-full object-cover"
              />
            </button>
          </div>

          <div className="flex-1 p-8 md:p-12 flex flex-col gap-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-[#9A7D0A] font-black text-xs md:text-sm tracking-wider uppercase mb-1">
                  {data.kategori || "BARANG PRIBADI"}
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#002B5B] leading-[1.1]">
                  {data.nama_barang || data.nama}
                </h2>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">
                  {data.status_barang || data.status || "DILAPORKAN"}
                </p>
                <p className="text-xs md:text-sm font-bold text-[#002B5B] leading-snug">
                  {formatTanggal(data.tanggal_kejadian || data.tgl || data.tanggal)}
                </p>
              </div>
            </div>

            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-xl">
              {data.deskripsi || "Tidak ada deskripsi tambahan untuk barang ini."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
              <div className="bg-[#F8FAFC] border border-gray-100 px-4 py-3 rounded-xl shadow-sm min-h-[74px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Lokasi
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="fas fa-map-marker-alt text-[#002B5B] shrink-0"></i>
                  <span className="line-clamp-2">{data.lokasi || "-"}</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-100 px-4 py-3 rounded-xl shadow-sm min-h-[74px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Jenis Laporan
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="fas fa-clipboard-list text-[#002B5B] shrink-0"></i>
                  <span>{reportTypeLabel}</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-100 px-4 py-3 rounded-xl shadow-sm min-h-[74px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {dateLabel}
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="far fa-calendar-alt text-[#002B5B] shrink-0"></i>
                  <span>{formatTanggal(data.tanggal_kejadian || data.tgl || data.tanggal)}</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-100 px-4 py-3 rounded-xl shadow-sm min-h-[74px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Status Klaim
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="fas fa-circle-check text-[#002B5B] shrink-0"></i>
                  <span>{canClaim ? "Belum diklaim" : "Tidak tersedia"}</span>
                </div>
              </div>
            </div>

            {canClaim && (
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                    <i className="fas fa-clipboard-check text-sm"></i>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#0B2B5B]">
                      Proses klaim barang
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                      Lanjutkan ke halaman klaim untuk memilih laporan kehilangan yang sesuai.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-gray-50 pt-6 mt-auto gap-4">
              <p className="text-gray-300 font-bold text-xs tracking-tight">
                ID: #{barangId || "IPB-0851"}
              </p>

              {canClaim ? (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="bg-[#002B5B] hover:bg-blue-950 disabled:bg-gray-300 disabled:shadow-none text-white font-bold text-xs md:text-sm py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/15 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Ajukan Klaim
                </button>
              ) : (
                <span className="bg-blue-50 text-[#2563EB] font-bold text-xs md:text-sm py-3.5 px-5 rounded-xl">
                  Tidak tersedia untuk klaim
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isImagePreviewOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImagePreviewOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white text-[#002B5B] hover:bg-gray-100 transition-colors"
            aria-label="Tutup foto"
          >
            <i className="fas fa-times"></i>
          </button>

          <img
            src={getImageSrc(data)}
            alt={data.nama_barang || data.nama}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ModalDetail;
