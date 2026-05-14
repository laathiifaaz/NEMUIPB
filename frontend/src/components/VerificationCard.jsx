import React, { Component } from "react";

class VerificationCard extends Component {
  renderStatusColor() {
    const { report } = this.props;

    switch (report.status_verifikasi) {
      case "terverifikasi":
        return "bg-green-100 text-green-700";

      case "ditolak":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  render() {
    const { report, onClick } = this.props;

    return (
      <div
        onClick={onClick}
        className="
          bg-white
          rounded-3xl
          p-6
          shadow-sm
          cursor-pointer
          hover:shadow-lg
          transition-all
        "
      >
        {/* STATUS */}
        <div
          className={`
            inline-flex
            px-4
            py-1
            rounded-full
            text-xs
            font-bold
            mb-4
            ${this.renderStatusColor()}
          `}
        >
          {report.status_verifikasi}
        </div>

        {/* JENIS */}
        <h2 className="text-2xl font-bold text-[#002B5B] mb-2 capitalize">
          {report.jenis_laporan}
        </h2>

        {/* STATUS */}
        <p className="text-gray-500 mb-1">
          Status Laporan:
          {" "}
          {report.status_laporan}
        </p>

        {/* TANGGAL */}
        <p className="text-gray-400 text-sm mb-5">
          {report.tanggal_laporan}
        </p>

        {/* BUTTON */}
        <button
          className="
            w-full
            bg-[#002B5B]
            text-white
            py-3
            rounded-2xl
            font-semibold
          "
        >
          View Details
        </button>
      </div>
    );
  }
}

export default VerificationCard;