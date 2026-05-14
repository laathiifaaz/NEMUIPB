import ApiService from "./ApiServices";

class BarangService extends ApiService {
  async getAllBarang() {
    const res = await fetch(`${this.baseUrl}/barang`);
    return this.handleResponse(res);
  }

  async getDetailBarang(barangId) {
    const res = await fetch(`${this.baseUrl}/barang/${barangId}`);
    return this.handleResponse(res);
  }

  async searchBarang(keyword) {
    const res = await fetch(
      `${this.baseUrl}/barang/search?keyword=${encodeURIComponent(keyword)}`
    );

    return this.handleResponse(res);
  }

  async filterBarang(params) {
    const query = new URLSearchParams(params).toString();

    const res = await fetch(`${this.baseUrl}/barang/filter?${query}`);

    return this.handleResponse(res);
  }

  async klaimBarang(barangId, laporanKehilanganId) {
    const res = await fetch(`${this.baseUrl}/barang/${barangId}/klaim`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        laporan_kehilangan_id: laporanKehilanganId,
      }),
    });

    return this.handleResponse(res);
  }
}

export default new BarangService();