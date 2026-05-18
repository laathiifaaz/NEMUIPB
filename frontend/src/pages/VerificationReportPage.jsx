import React, { Component } from "react";
import Sidebar from "../components/Sidebar";
import ReportService from "../services/ReportService";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class VerificationReportPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      reports: [],
      selectedReport: null,
      loading: true,
      searchQuery: "",
      isSidebarExpanded: getStoredSidebarExpanded(),
    };
  }

    handleSearch = (e) => {
    this.setState({
      searchQuery: e.target.value,
    });
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  componentDidMount() {

    this.setState({
      loading: true,
    });

    ReportService.getMyReports()
      .then((reports) => {

        console.log("REPORTS:", reports);

        this.setState({
          reports: reports || [],
          selectedReport:
            reports && reports.length > 0
              ? reports[0]
              : null,
          loading: false,
        });
      })
      .catch((error) => {

        console.error(error);

        this.setState({
          loading: false,
        });
      });
}

  renderStatusColor(status) {
    if (!status) {
      return "bg-gray-100 text-gray-600";
    }

    switch (status.toLowerCase()) {
      case "terverifikasi":
        return "bg-green-100 text-green-700";

      case "under review":
        return "bg-yellow-100 text-yellow-700";

      case "verifying":
        return "bg-blue-100 text-blue-700";

      case "ditolak":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

    renderBadgeColor(status) {

    if (!status) {
      return "bg-gray-100 text-gray-500";
    }

    switch (status.toLowerCase()) {

      case "disetujui":
        return "bg-blue-100 text-[#0B2B5B]";

      case "diproses":
        return "bg-yellow-100 text-yellow-700";

      case "menunggu":
        return "bg-orange-100 text-orange-700";

      case "ditolak":
        return "bg-red-100 text-red-700";

      case "siap_diambil":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  renderStatusIcon(status) {

  if (!status) {
    return "⌛";
  }

  switch (status.toLowerCase()) {

    case "disetujui":
      return "✓";

    case "menunggu":
      return "⌛";

    case "diproses":
      return "⟳";

    case "ditolak":
      return "✕";

    default:
      return "•";
  }
}

  render() {
    const {
      reports,
      selectedReport,
      loading,
    } = this.state;

    const filteredReports = reports.filter((report) => {

    const query =
      this.state.searchQuery.toLowerCase();

    return (
      report.nama_barang
        ?.toLowerCase()
        .includes(query) ||

      report.kategori
        ?.toLowerCase()
        .includes(query) ||

      report.lokasi
        ?.toLowerCase()
        .includes(query)
    );
  });


    return (
      <div className="flex min-h-screen bg-[#F5F7FB]">

        {/* SIDEBAR */}
        <Sidebar
          navigate={this.props.navigate}
          currentPath="/verifikasi"
          handleLogout={this.props.handleLogout}
          expanded={this.state.isSidebarExpanded}
        />

        {/* MAIN */}
        <div
          className={`
            flex-1 px-8 py-7
            transition-[margin] duration-300
            ${this.state.isSidebarExpanded ? "ml-64" : "ml-0"}
          `}
        >

          <PageHeader
            onToggleSidebar={this.toggleSidebar}
          />

          {/* HEADER */}
          <div className="mb-7">

            <h1 className="text-[40px] font-bold text-[#0B2B5B] mb-2">
              Verifikasi Laporan
            </h1>

            <p className="text-[14px] text-gray-500">
              Kelola dan validasi laporan barang hilang & ditemukan.
            </p>

          </div>

          {/* LOADING */}
          {loading ? (

            <div className="text-gray-500">
              Loading...
            </div>

          ) : (

            <div className="grid grid-cols-12 gap-5">

              {/* LEFT SIDE */}
              <div className="col-span-3 space-y-4">

                {/* SEARCH */}
                <div className="relative mb-6">

                  <i
                    className="
                      fas fa-search
                      absolute
                      left-5
                      top-1/2
                      -translate-y-1/2
                      text-[#7A8699]
                      text-sm
                    "
                  ></i>

                  <input
                    type="text"
                    placeholder="Cari laporan barang..."
                    value={this.state.searchQuery}
                    onChange={this.handleSearch}
                    className="
                      w-full
                      bg-white
                      rounded-2xl
                      pl-12
                      pr-5
                      py-4
                      text-sm
                      text-[#102348]
                      shadow-[0_2px_12px_rgba(0,0,0,0.05)]
                      outline-none
                      transition-all
                      placeholder:text-gray-400

                      hover:shadow-[0_4px_18px_rgba(0,0,0,0.07)]

                      focus:shadow-[0_6px_24px_rgba(27,77,155,0.12)]
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />

                </div>

                {reports.length === 0 ? (

                  <div className="bg-white rounded-3xl p-5 text-gray-400 text-sm shadow-sm border border-gray-100">
                    Tidak ada laporan
                  </div>

                ) : (

                  

                  filteredReports.map((report) => (
                    <div
                      key={report.laporan_id}

                      className={`
                        rounded-[28px]
                        p-4
                        cursor-pointer
                        transition-all
                        border
                        shadow-sm

                        ${
                          selectedReport?.laporan_id ===
                          report.laporan_id
                            ? "bg-[#0B2B5B] border-[#0B2B5B] text-white"
                            : "bg-white border-gray-100 hover:shadow-md"
                        }
                      `}
                    >

                      {/* STATUS */}
                      <div
                        className={`
                          px-4
                          py-1
                          mb-2
                          rounded-full
                          text-[10px]
                          font-bold
                          inline-flex
                          items-center
                          justify-center

                          ${this.renderBadgeColor(
                            report.status_laporan
                          )}
                        `}
                      >
                        {report.status_laporan
                          .replace("_", " ")
                          .toUpperCase()}
                      </div>

                      {/* TITLE */}
                      <h2 className="text-[18px] font-bold mb-2 capitalize">
                        {report.nama_barang}
                        
                      </h2>
                      {/*Jenis Laporan*/}
                        <p
                          className={`
                            text-[11px]
                            uppercase
                            tracking-wide
                            font-bold
                            mt-1
                            ${
                              selectedReport?.laporan_id === report.laporan_id
                                ? "text-blue-200"
                                : "text-[#5B6B8B]"
                            }
                          `}
                        >
                          {report?.jenis_laporan || report?.jenisLaporan || "-"}
                        </p>

                      {/* DATE */}
                      <p
                        className={`
                          text-[11px]
                          mb-4

                          ${
                            selectedReport?.laporan_id ===
                            report.laporan_id
                              ? "text-gray-200"
                              : "text-gray-500"
                          }
                        `}
                      >
                        {report.tanggal_kejadian}
                      </p>

                      {/* BUTTON */}
                      <button
                        onClick={() =>
                          this.setState({
                            selectedReport: report,
                          })
                        }
                        className={`
                          mt-5
                          w-full
                          py-3
                          rounded-2xl
                          text-[12px]
                          font-semibold
                          transition-all
                          duration-200
                          border

                          ${
                            selectedReport?.laporan_id ===
                            report.laporan_id
                              ? `
                                bg-white/60
                                backdrop-blur-sm
                                text-[#0B2B5B]
                                shadow-sm
                              `
                              : `
                                bg-[#0B2B5B]
                                text-white
                                border-[#0B2B5B]
                                hover:opacity-90
                              `
                          }
                        `}
                      >
                        <div className="flex items-center justify-center gap-2">

                          <i className="fas fa-eye text-[11px]"></i>

                          <span>
                            View Details
                          </span>

                        </div>
                      </button>

                    </div>
                  ))

                )}

              </div>

              {/* CENTER */}
              <div className="col-span-5 bg-white rounded-[34px] p-7 shadow-sm border border-gray-100">

                {selectedReport ? (

                  <>

                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-8">

                      <div>

                        <p className="text-[13px] text-gray-500">
                          Tracking status verifikasi laporan
                        </p>

                      </div>

                      <div
                        className={`
                          px-4
                          py-2
                          rounded-full
                          text-[11px]
                          font-bold

                          ${this.renderStatusColor(
                            selectedReport.status_verifikasi
                          )}
                        `}
                      >
                        {selectedReport.status_verifikasi}
                      </div>

                    </div>
                    
            {/* TIMELINE */}
            <div className="space-y-8">

              {/* STEP 1 */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold

                  ${
                    [
                      "menunggu",
                      "diproses",
                      "disetujui",
                      "siap_diambil",
                      "ditolak"
                    ].includes(selectedReport.status_laporan)
                      ? "bg-[#0B2B5B] text-white"
                      : "bg-gray-100 text-gray-400"
                  }
                    `}
                  >
                    <i className="fas fa-file-alt"></i>
                  </div>

                  <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

                </div>

                <div>

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Laporan Dibuat
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    Jenis laporan:
                    <span className="font-semibold capitalize ml-1">
                      {selectedReport.jenis_laporan}
                    </span>
                  </p>

                  <p className="text-[12px] text-gray-400 mt-2">
                    Dibuat pada{" "}
                    {selectedReport.created_time
                      ? new Date(
                          selectedReport.created_time
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>

                </div>

              </div>
              {/* STEP 2 */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold

                  ${
                    ["menunggu", "diproses"].includes(
                      selectedReport.status_laporan
                    )
                      ? "bg-[#DBEAFE] text-[#2563EB]"

                      : [
                          "disetujui",
                          "siap_diambil",
                          "ditolak"
                        ].includes(selectedReport.status_laporan)

                      ? "bg-[#0B2B5B] text-white"
                      : "bg-gray-100 text-gray-400"
                  }
                    `}
                  >
                    <i className="fas fa-search"></i>
                  </div>

                  <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

                </div>

                <div>

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Sedang Ditinjau
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    Admin memeriksa laporan.
                  </p>

                </div>

              </div>

          {/* STEP 3 */}
            <div className="flex gap-4">

              <div className="flex flex-col items-center">

                <div
                  className={`
                    w-11
                    h-11
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-bold

                  ${
                    selectedReport.status_laporan === "ditolak"
                      ? "bg-red-100 text-red-600"

                      : selectedReport.status_laporan === "disetujui"
                      ? "bg-[#DBEAFE] text-[#2563EB]"

                      : selectedReport.status_laporan === "siap_diambil"
                      ? "bg-[#0B2B5B] text-white"

                      : "bg-gray-100 text-gray-400"
                  }
                  `}
                >
                  <i
                    className={
                      selectedReport.status_laporan === "ditolak"
                        ? "fas fa-times-circle"
                        : "fas fa-check-circle"
                    }
                  ></i>
                </div>

                <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

              </div>

              <div className="flex-1">

                <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                  Verifikasi Final
                </h3>

                <p
                  className={`
                    text-[12px]
                    capitalize
                    ${
                      selectedReport.status_laporan === "ditolak"
                        ? "text-red-500"
                        : selectedReport.status_laporan === "disetujui"
                        ? "text-green-600"
                        : selectedReport.status_laporan === "siap_diambil"
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  `}
                >
                  Status:
                  <span className="font-semibold ml-1">

                    {selectedReport.status_laporan === "ditolak"
                      ? "Verifikasi gagal"

                      : selectedReport.status_laporan === "disetujui"
                      ? "Sudah disetujui"

                      : selectedReport.status_laporan === "siap_diambil"
                      ? "Barang siap diambil"

                      : "Menunggu verifikasi"}

                  </span>
                </p>

                {/* JIKA DITOLAK */}
                {selectedReport.status_laporan === "ditolak" && (

                  <div className="
                    mt-4
                    bg-red-50
                    text-red-700
                    rounded-2xl
                    px-4
                    py-3
                    text-[13px]
                  ">

                    <p className="font-bold mb-1">
                      Catatan Verifikasi
                    </p>

                    <p>
                      {selectedReport.catatan_verifikasi ||
                        "Pengajuan gagal diverifikasi. Silakan ajukan ulang laporan."}
                    </p>

                  </div>
                )}

                {/* BUTTON AJUKAN ULANG */}
                {selectedReport.status_laporan === "ditolak" && (

                  <button
                    onClick={() =>
                      this.props.navigate("/laporan-ulang")
                    }
                    className="
                      mt-4
                      bg-[#0B2B5B]
                      hover:bg-[#081F42]
                      text-white
                      px-5
                      py-3
                      rounded-2xl
                      text-sm
                      font-semibold
                      transition-all
                    "
                  >
                    Ajukan Ulang
                  </button>
                )}

              </div>

            </div>

              {/* STEP 4 */}
              <div className="flex gap-4">

                <div
                  className={`
                    w-11
                    h-11
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-bold

                    ${
                      selectedReport.status_laporan ===
                      "siap_diambil"
                        ? "bg-[#DBEAFE] text-[#2563EB]"
                        : "bg-gray-100 text-gray-400"
                    }
                  `}
                  >
                    <i className="fas fa-box"></i>
                  </div>

                <div>

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Siap Diambil
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    Barang siap diambil.
                  </p>

                </div>

              </div>

              {/* DETAIL */}
              <div className="bg-[#F8FAFC] rounded-3xl p-5 mt-6">

                <h3 className="text-[18px] font-bold text-[#0B2B5B] mb-5">
                  Lokasi Pengambilan
                </h3>

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <p className="text-[11px] text-gray-400 mb-1">
                      Nama Barang
                    </p>

                    <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                      {selectedReport.nama_barang}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[11px] text-gray-400 mb-1">
                      Kategori
                    </p>

                    <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                      {selectedReport.kategori}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[11px] text-gray-400 mb-1">
                      Lokasi
                    </p>

                    <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                      {selectedReport.lokasi}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[11px] text-gray-400 mb-1">
                      Tanggal
                    </p>

                    <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                      {selectedReport.tanggal_kejadian}
                    </h4>

                  </div>

                </div>

              </div>

                    {/* INFO CARD */}
                    <div className="bg-[#F8FAFC] rounded-3xl p-5">

                        <p className="text-[11px] text-gray-400 mb-2">
                        Lokasi Kehilangan
                        </p>

                        <h3 className="text-[18px] font-bold text-[#0B2B5B] mb-5">
                        {selectedReport.lokasi}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">

                        <div>

                            <p className="text-[11px] text-gray-400 mb-1">
                            Kategori
                            </p>

                            <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                            {selectedReport.kategori}
                            </h4>

                        </div>

                        <div>

                            <p className="text-[11px] text-gray-400 mb-1">
                            Tanggal
                            </p>

                            <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                            {selectedReport.tanggal_kejadian}
                            </h4>

                        </div>

                        </div>

                    </div>

                    </div>

                  </>
                      ) : (

                        <div className="h-full flex flex-col items-center justify-center py-24">

                          <div className="w-24 h-24 rounded-3xl bg-[#F8FAFC] flex items-center justify-center mb-6">

                            <i className="fas fa-inbox text-3xl text-[#0B2B5B]"></i>

                          </div>

                          <h2 className="text-[24px] font-bold text-[#0B2B5B] mb-3">
                            Belum Ada Laporan
                          </h2>

                          <p className="text-gray-400 text-[14px] text-center max-w-[320px] leading-relaxed">
                            Kamu belum memiliki laporan yang
                            masuk ke sistem verifikasi.
                          </p>

                        </div>

                      )}

              </div>

              {/* RIGHT */}
              <div className="col-span-4 space-y-4">

                {/* PICKUP */}
                <div className="bg-[#0B2B5B] rounded-[30px] p-6 text-white">

                  <h2 className="text-[24px] font-bold mb-2">
                    Pickup Key
                  </h2>

                  <p className="text-[12px] text-gray-300 mb-5">
                    Present after verification
                  </p>

                  <div className="bg-white rounded-3xl h-40 flex items-center justify-center text-[#0B2B5B] font-bold text-sm">
                    QR / KEY
                  </div>

                </div>

                {/* DETAIL */}
                <div className="
                  bg-[#E5EAF0]
                  rounded-2xl
                  p-5
                  shadow-sm
                ">

                  <h3 className="text-[20px] font-bold text-[#0B2B5B] mb-5">
                    Lokasi Pengambilan Barang
                  </h3>

                  <div className="space-y-5">

                  {/* LOKASI */}
                  <div className="flex items-start gap-4">

                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">

                      <i className="fas fa-map-marker-alt text-[#0B2B5B]"></i>

                    </div>

                    <div>

                      <p className="text-[11px] text-gray-400 mb-1">
                        Lokasi Pengambilan
                      </p>

                      <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                        Pos Keamanan Asrama IPB
                      </h4>

                      <p className="text-[12px] text-gray-500 mt-1">
                        Kampus IPB Dramaga, Bogor
                      </p>

                    </div>

                  </div>

                  {/* JAM */}
                  <div className="flex items-start gap-4">

                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">

                      <i className="far fa-clock text-[#0B2B5B]"></i>

                    </div>

                    <div>

                      <p className="text-[11px] text-gray-400 mb-1">
                        Jam Operasional
                      </p>

                      <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                        08.00 - 20.00 WIB
                      </h4>

                      <p className="text-[12px] text-gray-500 mt-1">
                        Senin - Jumat
                      </p>

                    </div>

                  </div>

                  {/* KONTAK */}
                  <div className="flex items-start gap-4">

                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">

                      <i className="fas fa-phone-alt text-[#0B2B5B]"></i>

                    </div>

                    <div>

                      <p className="text-[11px] text-gray-400 mb-1">
                        Kontak Petugas
                      </p>

                        <a
                          href="https://wa.me/6281234567890"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            text-[15px]
                            font-bold
                            text-[#0B2B5B]
                            hover:text-gray-400
                            transition-all
                            hover:underline
                          "
                        >
                          +62 812-3456-7890
                        </a>

                      <p className="text-[12px] text-gray-500 mt-1">
                        Admin NEMU IPB
                      </p>

                    </div>

                  </div>

                </div>

                </div>

              </div>

            </div>
          )}

          <PageFooter />

        </div>
      </div>
    );
  }
}

export default VerificationReportPage;
