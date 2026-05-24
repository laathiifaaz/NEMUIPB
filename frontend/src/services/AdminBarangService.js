import ApiService from "./ApiServices";

class AdminBarangService extends ApiService {
  async getAllBarang() {
    const res = await fetch(`${this.baseUrl}/barang/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async updateStatusBarang(barangId, statusBarang) {
    const res = await fetch(`${this.baseUrl}/admin/barang/${barangId}/status`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        status_barang: statusBarang,
      }),
    });

    return this.handleResponse(res);
  }

  async getLogs(actionType = "semua", sortBy = "newest") {
    const query = new URLSearchParams({
      action_type: actionType,
      sort_by: sortBy,
    }).toString();

    const res = await fetch(`${this.baseUrl}/admin/logs?${query}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async exportLogs() {
    const res = await fetch(`${this.baseUrl}/admin/logs/export`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }
}

const adminBarangService = new AdminBarangService();

export default adminBarangService;
