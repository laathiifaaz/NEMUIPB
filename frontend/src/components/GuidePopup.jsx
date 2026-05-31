import React from "react";

const userGuideSections = [
  {
    icon: "fa-search-minus",
    title: "Membuat Laporan Kehilangan",
    description: "Gunakan alur ini saat barang milikmu hilang di area IPB.",
    steps: [
      "Buka menu Laporan, lalu pilih Kehilangan.",
      "Isi nama barang, kategori, deskripsi, lokasi, dan tanggal kehilangan.",
      "Unggah foto atau bukti visual jika tersedia.",
      "Kirim laporan dan tunggu verifikasi admin.",
      "Pantau status laporan hingga disetujui atau ditolak.",
    ],
  },
  {
    icon: "fa-search-plus",
    title: "Membuat Laporan Penemuan",
    description: "Gunakan alur ini saat kamu menemukan barang milik orang lain.",
    steps: [
      "Buka menu Laporan, lalu pilih Penemuan.",
      "Isi detail barang yang ditemukan dengan informasi yang jelas.",
      "Tambahkan lokasi dan tanggal barang ditemukan.",
      "Unggah foto barang agar mudah dikenali.",
      "Setelah laporan disetujui admin, buka detail laporan untuk melihat kode dropoff.",
      "Gunakan kode dropoff saat menyerahkan barang ke Pos Keamanan NEMU IPB.",
    ],
  },
  {
    icon: "fa-hand-holding",
    title: "Cara Klaim Barang",
    description: "Gunakan klaim jika barang penemuan di koleksi sesuai dengan barang hilang milikmu.",
    steps: [
      "Pastikan kamu sudah membuat laporan kehilangan yang sudah disetujui admin.",
      "Buka Koleksi Barang dan pilih barang berstatus ditemukan.",
      "Buka detail barang lalu klik Ajukan Klaim.",
      "Pilih laporan kehilangan yang sesuai dengan barang tersebut.",
      "Kirim klaim dan tunggu verifikasi admin.",
      "Jika klaim disetujui, kamu akan menerima kode pickup untuk pengambilan barang di Pos Keamanan NEMU IPB.",
    ],
  },
];

const adminGuideSections = [
  {
    icon: "fa-clipboard-check",
    title: "Verifikasi Laporan",
    description: "Gunakan alur ini untuk memeriksa laporan kehilangan dan penemuan civitas.",
    steps: [
      "Buka menu Verifikasi, lalu pilih tampilan Verifikasi Laporan.",
      "Periksa detail barang, pelapor, lokasi, tanggal, dan dokumentasi.",
      "Klik Setujui jika laporan valid.",
      "Klik Tolak dan isi catatan jika laporan tidak sesuai.",
      "Sistem mengirim notifikasi hasil verifikasi ke civitas terkait.",
    ],
  },
  {
    icon: "fa-handshake",
    title: "Verifikasi Klaim Barang",
    description: "Gunakan alur ini saat civitas mengajukan klaim barang ditemukan.",
    steps: [
      "Buka menu Verifikasi, lalu pilih tampilan Verifikasi Klaim Barang.",
      "Cocokkan barang ditemukan dengan laporan kehilangan yang dipilih user.",
      "Klik Tolak Klaim jika data tidak sesuai.",
      "Klik Terima & Buat Serah Terima jika klaim valid.",
      "Sistem membuat dokumen serah terima, hash, dan tanda tangan digital.",
    ],
  },
  {
    icon: "fa-box",
    title: "Pantau Aktivitas Barang",
    description: "Gunakan halaman Koleksi Barang admin untuk melihat log aktivitas sistem.",
    steps: [
      "Buka menu Koleksi Barang.",
      "Gunakan filter action type untuk melihat aktivitas tertentu.",
      "Pilih Dikembalikan untuk melihat barang yang sudah selesai dikembalikan.",
      "Gunakan export CSV jika data log perlu direkap.",
      "Cek timestamp dan admin terkait untuk audit aktivitas.",
    ],
  },
];

const GuidePopup = ({ open, onClose, variant = "user" }) => {
  if (!open) return null;

  const guideSections = variant === "admin" ? adminGuideSections : userGuideSections;
  const eyebrow = variant === "admin" ? "Panduan Admin" : "Panduan Pengguna";
  const title = variant === "admin" ? "Alur Kerja Admin" : "Alur Kerja NEMU IPB";
  const description =
    variant === "admin"
      ? "Ringkasan langkah untuk verifikasi laporan, verifikasi klaim, dan monitoring log barang."
      : "Ringkasan langkah untuk membuat laporan kehilangan, laporan penemuan, dan klaim barang.";

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/45 flex items-center justify-center px-4 py-6 font-['Plus_Jakarta_Sans']"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[28px] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#EEF2F6] px-6 py-5 flex items-start justify-between gap-4 rounded-t-[28px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] mb-2">
              {eyebrow}
            </p>

            <h2 className="text-2xl md:text-3xl font-extrabold text-[#002B5B]">
              {title}
            </h2>

            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
            aria-label="Tutup panduan"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 gap-4">
          {guideSections.map((section) => (
            <section
              key={section.title}
              className="border border-[#E7ECF3] rounded-2xl p-5 bg-white"
            >
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <i className={`fas ${section.icon}`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-[#002B5B]">
                    {section.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {section.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    {section.steps.map((step, index) => (
                      <div
                        key={step}
                        className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] border border-gray-100 px-4 py-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-white border border-blue-100 text-[#2563EB] flex items-center justify-center text-[10px] font-black shrink-0">
                          {index + 1}
                        </span>

                        <p className="text-xs leading-relaxed font-semibold text-[#102348]">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidePopup;
