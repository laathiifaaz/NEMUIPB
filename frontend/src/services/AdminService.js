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

  async getRecentReports(statusVerifikasi = "semua") {
    const query = new URLSearchParams({
      status_verifikasi: statusVerifikasi,
    }).toString();

    const res = await fetch(`${this.baseUrl}/admin/laporan/recent?${query}`, {
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

  async exportReports() {
    const res = await fetch(`${this.baseUrl}/admin/laporan/export`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }
}

const adminService = new AdminService();

export default adminService;