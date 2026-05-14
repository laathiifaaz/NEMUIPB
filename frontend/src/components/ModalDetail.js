import React from 'react';

const ModalDetail = ({ data, onClose }) => {
  // Antisipasi jika data belum di-load agar tidak crash
  if (!data) return null;

  // Fungsi helper untuk mengubah format tanggal YYYY-MM-DD menjadi Bulan DD, YYYY
  const formatTanggal = (dateString) => {
    if (!dateString) return "Okt 24, 2025";
    
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    const date = new Date(dateString);
    
    // Mengembalikan string tanggal berformat Indonesia (contoh: Mei 02, 2026)
    return date.toLocaleDateString('id-ID', options);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/45 flex justify-center items-center z-[9999] p-5 font-['Plus_Jakarta_Sans']" 
      onClick={onClose}
    >
      {/* Box Utama Modal (Mencegah close saat area dalam diklik) */}
      <div 
        className="w-full max-w-[1020px] bg-white rounded-[40px] overflow-hidden relative shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Judul Tab Kecil Kiri Atas (Sesuai gambar "Details") */}
        <div className="absolute top-4 left-6 z-10 hidden sm:block">
          <span className="text-sm font-bold text-gray-400">Details</span>
        </div>

        {/* Tombol Close Pojok Kanan Atas */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-6 text-gray-400 hover:text-gray-600 text-xl transition-colors z-20"
        >
          ✕
        </button>

        {/* Flex Container Split Screen */}
        <div className="flex flex-col md:flex-row min-h-[500px]">
          
          {/* SISI KIRI: IMAGE CONTAINER */}
          <div className="w-full md:w-[38%] bg-gray-50 flex items-center justify-center overflow-hidden max-h-[350px] md:max-h-none">
            <img
              src={data.foto_url || data.img || data.image || "/assets/images/placeholder.jpg"}
              alt={data.nama_barang || data.nama}
              className="w-full h-full object-cover"
            />
          </div>

          {/* SISI KANAN: SPESIFIKASI CONTENT */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-between gap-6">
            
            {/* TOP BAR: Judul & Informasi Tanggal */}
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
                {/* Di sini fungsi helper dipanggil untuk merubah format mentah date */}
                <p className="text-xs md:text-sm font-bold text-[#002B5B] leading-snug">
                  {formatTanggal(data.tanggal_kejadian || data.tgl || data.tanggal)}
                </p>
              </div>
            </div>

            {/* DESKRIPSI BARANG */}
            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-xl">
              {data.deskripsi || "Tidak ada deskripsi tambahan untuk barang ini."}
            </p>

            {/* INFO CHIPS ROADBAR (Lokasi & Tempat Penyimpanan) */}
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

            {/* FOOTER BAR: ID & Akses Button */}
            <div className="flex justify-between items-center border-t border-gray-50 pt-6">
              <p className="text-gray-300 font-bold text-xs tracking-tight">
                ID: #{data.id || "IPB-0851"}
              </p>

              <button className="bg-[#002B5B] hover:bg-blue-950 text-white font-bold text-xs md:text-sm py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/15 hover:scale-[1.02] active:scale-[0.98]">
                Klaim Barang
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalDetail;