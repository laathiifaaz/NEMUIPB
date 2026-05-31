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
    const query = new URLSearchParams({
      range,
      filter,
    }).toString();

    const res = await fetch(`${this.baseUrl}/admin/analytics?${query}`, {
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

  async getClaimHistory() {
    const res = await fetch(`${this.baseUrl}/admin/klaim/history`, {
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

  async verifyPickupCode(pickupCode) {
    const res = await fetch(`${this.baseUrl}/admin/klaim/pickup/verify`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        pickup_code: pickupCode,
      }),
    });

    return this.handleResponse(res);
  }

  async getPickupHistory() {
    const res = await fetch(`${this.baseUrl}/admin/serah-terima/history`, {
      headers: this.getAuthHeaders(),
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
