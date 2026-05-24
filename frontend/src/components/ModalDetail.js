import React, { useEffect, useMemo, useState } from "react";
import BarangService from "../services/BarangService";
import ReportService from "../services/ReportService";

const ModalDetail = ({ data, onClose }) => {
  const [lostReports, setLostReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");

  const barangId = data?.barang_id || data?.id;
  const canClaim =
    data?.status_barang === "ditemukan" && data?.jenis_laporan !== "kehilangan";

  const selectedReport = useMemo(
    () =>
      lostReports.find(
        (report) => String(report.laporan_id) === String(selectedReportId)
      ),
    [lostReports, selectedReportId]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchLostReports = async () => {
      if (!canClaim) return;

      setReportsLoading(true);

      try {
        const reports = await ReportService.getMyReports();
        const availableReports = (Array.isArray(reports) ? reports : []).filter(
          (report) => report.status_laporan !== "ditolak"
        );

        if (isMounted) {
          setLostReports(availableReports);
          setSelectedReportId(
            availableReports.length > 0
              ? String(availableReports[0].laporan_id)
              : ""
          );
          setReportsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setLostReports([]);
          setReportsLoading(false);
        }
      }
    };

    fetchLostReports();

    return () => {
      isMounted = false;
    };
  }, [canClaim, barangId]);

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

  const handleClaim = async () => {
    if (!barangId || !selectedReportId) {
      setClaimError("Pilih laporan kehilangan yang sesuai terlebih dahulu.");
      setClaimMessage("");
      return;
    }

    setClaimLoading(true);
    setClaimError("");
    setClaimMessage("");

    try {
      const result = await BarangService.klaimBarang(
        barangId,
        Number(selectedReportId)
      );

      setClaimMessage(
        result.message ||
          "Klaim berhasil diajukan dan menunggu verifikasi admin."
      );
    } catch (error) {
      setClaimError(error.message || "Gagal mengajukan klaim barang.");
    } finally {
      setClaimLoading(false);
    }
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
            <img
              src={getImageSrc(data)}
              alt={data.nama_barang || data.nama}
              className="w-full h-full object-cover"
            />
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

            <div className="flex flex-wrap gap-3 my-2">
              <div className="bg-[#F8FAFC] border border-gray-100 px-5 py-2.5 rounded-xl flex items-center gap-3 font-semibold text-gray-700 text-xs md:text-sm shadow-sm">
                <i className="fas fa-map-marker-alt text-[#002B5B]"></i>
                <span>{data.lokasi || "Fakultas Ekonomi"}</span>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-100 px-5 py-2.5 rounded-xl flex items-center gap-3 font-semibold text-gray-700 text-xs md:text-sm shadow-sm">
                <i className="fas fa-archive text-[#002B5B]"></i>
                <span>{data.penyimpanan || "Penyimpanan #B-12"}</span>
              </div>
            </div>

            {canClaim && (
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                    <i className="fas fa-clipboard-check text-sm"></i>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#0B2B5B]">
                      Proses klaim barang
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                      Pilih laporan kehilangan milikmu yang paling sesuai. Admin akan memverifikasi klaim sebelum barang bisa diambil.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["Pilih laporan", "Ajukan klaim", "Verifikasi admin"].map(
                    (step, index) => (
                      <div
                        key={step}
                        className="rounded-xl bg-white border border-gray-100 px-3 py-2"
                      >
                        <p className="text-[10px] font-black text-[#2563EB]">
                          0{index + 1}
                        </p>
                        <p className="text-[11px] font-bold text-[#0B2B5B] leading-tight">
                          {step}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {reportsLoading ? (
                  <div className="text-xs font-semibold text-gray-400">
                    Memuat laporan kehilangan...
                  </div>
                ) : lostReports.length === 0 ? (
                  <div className="bg-white border border-blue-100 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
                    Kamu belum punya laporan kehilangan yang bisa dipakai untuk klaim. Buat laporan kehilangan dulu, lalu kembali ke barang ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedReportId}
                      onChange={(event) =>
                        setSelectedReportId(event.target.value)
                      }
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-[#0B2B5B] outline-none focus:border-[#2563EB]"
                    >
                      {lostReports.map((report) => (
                        <option
                          key={report.laporan_id}
                          value={report.laporan_id}
                        >
                          #{report.laporan_id} - {report.nama_barang}
                        </option>
                      ))}
                    </select>

                    {selectedReport && (
                      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-xs text-gray-500">
                        <span className="font-bold text-[#0B2B5B]">
                          Laporan #{selectedReport.laporan_id}
                        </span>
                        <span className="mx-2">-</span>
                        <span>{selectedReport.lokasi}</span>
                      </div>
                    )}
                  </div>
                )}

                {claimError && (
                  <div className="mt-3 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-xs font-bold">
                    {claimError}
                  </div>
                )}

                {claimMessage && (
                  <div className="mt-3 bg-blue-50 text-[#1D4ED8] rounded-xl px-4 py-3 text-xs font-bold">
                    {claimMessage}
                  </div>
                )}
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
                  disabled={claimLoading || reportsLoading || !selectedReportId}
                  className="bg-[#002B5B] hover:bg-blue-950 disabled:bg-gray-300 disabled:shadow-none text-white font-bold text-xs md:text-sm py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/15 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {claimLoading ? "Mengajukan..." : "Ajukan Klaim"}
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
    </div>
  );
};

export default ModalDetail;
