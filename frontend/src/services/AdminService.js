import ApiService from "./ApiServices";

class AdminService extends ApiService {
  async getSummary() {
    const res = await fetch(`${this.baseUrl}/admin/dashboard/summary`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(res);
  }

  async getChart() {
    const res = await fetch(`${this.baseUrl}/admin/dashboard/chart`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(res);
  }

  async getAnalytics({ range = "30_hari", filter = "tinggi" } = {}) {
    const [summary, chart, reports] = await Promise.all([
      this.getSummary(),
      this.getChart(),
      this.getAllReports(),
    ]);

    const reportList = Array.isArray(reports) ? reports : [];
    const now = new Date();

    const rangeDays = {
      "7_hari": 7,
      "30_hari": 30,
      "bulan_ini": null,
      "tahun_ini": null,
    };

    const inSelectedRange = (item) => {
      const dateValue = item.created_time || item.tanggal_kejadian;
      if (!dateValue) return true;

      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return true;

      if (range === "bulan_ini") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      if (range === "tahun_ini") {
        return date.getFullYear() === now.getFullYear();
      }

      const days = rangeDays[range] || 30;
      const start = new Date(now);
      start.setDate(now.getDate() - days + 1);
      start.setHours(0, 0, 0, 0);

      return date >= start;
    };

    const filteredReports = reportList.filter(inSelectedRange);
    const foundReports = filteredReports.filter(
      (item) => item.jenis_laporan === "penemuan"
    );
    const completedReports = filteredReports.filter(
      (item) => item.status_barang === "selesai"
    );
    const successRate = foundReports.length
      ? Math.round((completedReports.length / foundReports.length) * 100)
      : 0;

    const categories = Object.entries(
      filteredReports.reduce((acc, item) => {
        const key = item.kategori || "Lainnya";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const categoryColors = [
      "bg-[#163A70]",
      "bg-[#8E793E]",
      "bg-[#006D8F]",
      "bg-[#0F9F4B]",
      "bg-[#D92D20]",
    ];

    const totalCategoryCount =
      categories.reduce((total, [, count]) => total + count, 0) || 1;

    const hotspots = Object.entries(
      filteredReports.reduce((acc, item) => {
        const key = item.lokasi || "Lokasi tidak diketahui";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => (filter === "rendah" ? a[1] - b[1] : b[1] - a[1]))
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return {
      stats: {
        total_found: summary.total_found || foundReports.length,
        found_trend: `${foundReports.length} laporan`,
        success_rate: `${successRate}%`,
        success_status: successRate >= 70 ? "Baik" : "Perlu dipantau",
        avg_return_time: `${summary.returned_items || 0} barang`,
        return_trend: "Dikembalikan",
      },
      monthlyTrends: (Array.isArray(chart) ? chart : []).map((item) => ({
        month: item.week,
        reported: (item.lost || 0) + (item.found || 0),
        returned: item.found || 0,
      })),
      categories: categories.map(([name, count], index) => ({
        name,
        count,
        percentage: Math.round((count / totalCategoryCount) * 100),
        color: categoryColors[index % categoryColors.length],
      })),
      hotspots,
    };
  }

  async getRecentReports(statusVerifikasi = "semua") {
    const query = new URLSearchParams({
      status_verifikasi: statusVerifikasi,
    }).toString();

    const res = await fetch(`${this.baseUrl}/admin/laporan/recent?${query}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async getAllReports() {
    const res = await fetch(`${this.baseUrl}/admin/laporan`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async verifyReport(laporanId, catatanVerifikasi = "Laporan valid dan disetujui admin") {
    const res = await fetch(`${this.baseUrl}/admin/laporan/${laporanId}/setujui`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ catatan_verifikasi: catatanVerifikasi }),
    });

    return this.handleResponse(res);
  }

  async denyReport(laporanId, catatanVerifikasi = "Laporan ditolak admin") {
    const res = await fetch(`${this.baseUrl}/admin/laporan/${laporanId}/tolak`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ catatan_verifikasi: catatanVerifikasi }),
    });

    return this.handleResponse(res);
  }

  async getPendingClaims() {
    const res = await fetch(`${this.baseUrl}/admin/klaim/pending`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async verifyClaim(klaimId, statusKlaim, catatanAdmin = "") {
    const res = await fetch(`${this.baseUrl}/admin/klaim/${klaimId}/verifikasi`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        status_klaim: statusKlaim,
        catatan_admin: catatanAdmin,
      }),
    });

    return this.handleResponse(res);
  }

  async getSerahTerima(klaimId) {
    const res = await fetch(`${this.baseUrl}/serah-terima/${klaimId}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async verifySerahTerima(klaimId) {
    const res = await fetch(`${this.baseUrl}/serah-terima/${klaimId}/verify`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async exportReports() {
    const res = await fetch(`${this.baseUrl}/admin/laporan/export`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }
}

const adminService = new AdminService();

export default adminService;
