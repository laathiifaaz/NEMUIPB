import React, { useEffect, useState } from "react";
import AuthService from "../services/AuthService";

const ModalDetail = ({ data, onClose, navigate, compact = false }) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setIsImagePreviewOpen(false);
    setImageError(false);
  }, [data]);

  const currentUser = AuthService.getCurrentUser();
  const currentUserId = currentUser?.user_id || currentUser?.id;
  const barangId = data?.barang_id || data?.id;
  const isOwnFindingReport =
    currentUserId &&
    data?.pelapor_user_id &&
    String(currentUserId) === String(data.pelapor_user_id);
  const canClaim =
    data?.status_barang === "ditemukan" &&
    data?.jenis_laporan === "penemuan" &&
    data?.status_laporan === "selesai" &&
    data?.status_verifikasi === "terverifikasi" &&
    !isOwnFindingReport;

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

  const imageSrc = getImageSrc(data);
  const showImageFallback = imageError || !imageSrc;

  const formatTanggal = (dateString) => {
    if (!dateString) return "Okt 24, 2025";

    const options = { year: "numeric", month: "short", day: "2-digit" };
    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", options);
  };

  const reportTypeLabel =
    data.jenis_laporan === "kehilangan" ? "Kehilangan" : "Penemuan";
  const dateLabel =
    data.jenis_laporan === "kehilangan"
      ? "Tanggal Kehilangan"
      : "Tanggal Penemuan";
  const statusLabel = data.status_barang || data.status || "DILAPORKAN";
  const statusBadgeClass =
    statusLabel === "hilang"
      ? "bg-blue-500"
      : statusLabel === "ditemukan"
      ? "bg-cyan-600"
      : statusLabel === "diklaim"
      ? "bg-[#0B2B5B]"
      : statusLabel === "selesai"
      ? "bg-green-600"
      : "bg-yellow-500";

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
      className={`fixed inset-0 bg-black/45 flex justify-center items-center z-[9999] font-['Plus_Jakarta_Sans'] ${
        compact ? "p-4" : "p-5"
      }`}
      onClick={onClose}
    >
        <div
        className={`w-full bg-white overflow-hidden relative shadow-2xl transition-all ${
          compact
            ? "max-w-[980px] max-h-[calc(100vh-32px)] rounded-[24px]"
            : "max-w-[1140px] max-h-[92vh] rounded-[32px]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-4 left-6 z-10 hidden sm:block">
          <span className="text-sm font-bold text-gray-400">Detail</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/95 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 text-xl transition-colors shadow-sm"
          aria-label="Tutup detail barang"
        >
          x
        </button>

        <div
          className={`flex flex-col md:flex-row overflow-hidden ${
            compact ? "max-h-[calc(100vh-32px)]" : "max-h-[92vh] overflow-y-auto"
          }`}
        >
          <div
            className={`w-full bg-gray-50 flex items-center justify-center overflow-hidden ${
              compact
                ? "md:w-[35%] h-60 md:h-auto"
                : "md:w-[39%] min-h-[300px] md:min-h-[660px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(true)}
              className="w-full h-full cursor-zoom-in"
              aria-label="Perbesar foto barang"
            >
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {showImageFallback ? (
                  <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-3 text-center px-6 border border-gray-100">
                    <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] text-[#163A70] flex items-center justify-center">
                      <i className="fas fa-image text-2xl"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#102348]">
                        Foto tidak tersedia
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tampilan detail tetap memakai ukuran yang sama.
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={imageSrc}
                    alt={data.nama_barang || data.nama}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </button>
          </div>

          <div
            className={`flex-1 flex flex-col min-w-0 ${
              compact
                ? "p-6 pr-16 md:p-8 md:pr-20 gap-3"
                : "p-9 pr-16 md:p-14 md:pr-20 gap-6"
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-[#9A7D0A] font-black text-xs md:text-sm tracking-wider uppercase mb-1">
                  {data.kategori || "BARANG PRIBADI"}
                </p>
                <h2
                  className={`font-extrabold text-[#002B5B] leading-[1.1] ${
                    compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                  }`}
                >
                  {data.nama_barang || data.nama}
                </h2>
              </div>

              <div className={`text-right shrink-0 ${statusBadgeClass} shadow-lg shadow-black/10 rounded-2xl px-3 py-2`}>
                <p className="text-[10px] font-black text-white tracking-wider uppercase mb-0">
                  {statusLabel}
                </p>
              </div>
            </div>

            <p
              className={`text-gray-500 leading-relaxed max-w-xl ${
                compact ? "text-sm" : "text-sm md:text-base"
              }`}
            >
              {data.deskripsi || "Tidak ada deskripsi tambahan untuk barang ini."}
            </p>

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                compact ? "" : "my-2"
              }`}
            >
              <div
                className={`bg-[#F8FAFC] border border-gray-100 rounded-xl shadow-sm ${
                  compact ? "px-3 py-2 min-h-[62px]" : "px-4 py-3 min-h-[74px]"
                }`}
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Lokasi
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="fas fa-map-marker-alt text-[#002B5B] shrink-0"></i>
                  <span className="line-clamp-2">{data.lokasi || "-"}</span>
                </div>
              </div>

              <div
                className={`bg-[#F8FAFC] border border-gray-100 rounded-xl shadow-sm ${
                  compact ? "px-3 py-2 min-h-[62px]" : "px-4 py-3 min-h-[74px]"
                }`}
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Jenis Laporan
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="fas fa-clipboard-list text-[#002B5B] shrink-0"></i>
                  <span>{reportTypeLabel}</span>
                </div>
              </div>

              <div
                className={`bg-[#F8FAFC] border border-gray-100 rounded-xl shadow-sm ${
                  compact ? "px-3 py-2 min-h-[62px]" : "px-4 py-3 min-h-[74px]"
                }`}
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {dateLabel}
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="far fa-calendar-alt text-[#002B5B] shrink-0"></i>
                  <span>{formatTanggal(data.tanggal_kejadian || data.tgl || data.tanggal)}</span>
                </div>
              </div>

              <div
                className={`bg-[#F8FAFC] border border-gray-100 rounded-xl shadow-sm ${
                  compact ? "px-3 py-2 min-h-[62px]" : "px-4 py-3 min-h-[74px]"
                }`}
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Status Klaim
                </p>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs md:text-sm">
                  <i className="fas fa-circle-check text-[#002B5B] shrink-0"></i>
                  <span>
                    {canClaim
                      ? "Belum diklaim"
                      : isOwnFindingReport
                      ? "Barang laporanmu"
                      : "Tidak tersedia"}
                  </span>
                </div>
              </div>
            </div>

            {canClaim && (
              <div className={`bg-[#F8FAFC] border border-gray-100 rounded-2xl ${compact ? "p-4" : "p-5"}`}>
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

            <div
              className={`flex justify-between items-center border-t border-gray-50 mt-auto gap-4 ${
                compact ? "pt-4" : "pt-6"
              }`}
            >
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
                  {isOwnFindingReport ? "Tidak bisa klaim laporan sendiri" : "Tidak tersedia untuk klaim"}
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
