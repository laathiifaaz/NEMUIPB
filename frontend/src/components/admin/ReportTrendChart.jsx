import React from "react";

const ReportTrendChart = ({ data = [], heightClass = "h-72" }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`${heightClass} flex items-center justify-center text-gray-400 text-sm`}>
        Belum ada data grafik.
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.reported || 0, item.returned || 0)),
    1
  );

  return (
    <div className={`${heightClass} flex items-end gap-6 pt-6 px-2 relative border-b border-gray-100`}>
      <div className="absolute inset-x-0 top-1/4 border-t border-gray-100 pointer-events-none"></div>
      <div className="absolute inset-x-0 top-2/4 border-t border-gray-100 pointer-events-none"></div>
      <div className="absolute inset-x-0 top-3/4 border-t border-gray-100 pointer-events-none"></div>

      {data.map((item, index) => {
        const reportedHeight = ((item.reported || 0) / maxValue) * 100;
        const returnedHeight = ((item.returned || 0) / maxValue) * 100;

        return (
          <div key={`${item.month}-${index}`} className="flex-1 flex flex-col items-center z-10">
            <div className="w-full flex items-end gap-1.5 h-56">
              <div className="relative group w-full flex items-end h-full">
                <div
                  className="w-full bg-[#A2B4C7] rounded-t-sm transition-all duration-500 hover:opacity-90"
                  style={{ height: `${Math.max(reportedHeight, item.reported ? 6 : 0)}%` }}
                ></div>
                <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0B2B5B] px-2.5 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Dilaporkan: {item.reported || 0}
                </span>
              </div>

              <div className="relative group w-full flex items-end h-full">
                <div
                  className="w-full bg-[#8E793E] rounded-t-sm transition-all duration-500 hover:opacity-90"
                  style={{ height: `${Math.max(returnedHeight, item.returned ? 6 : 0)}%` }}
                ></div>
                <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0B2B5B] px-2.5 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Laporan Selesai: {item.returned || 0}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-bold text-gray-400 mt-3 tracking-wider">
              {item.month}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ReportTrendChart;
