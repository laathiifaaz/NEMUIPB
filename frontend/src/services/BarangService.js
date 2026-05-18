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
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => {
        return value !== undefined && value !== null && value !== "";
      })
    );

    const query = new URLSearchParams(cleanParams).toString();

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

const barangService = new BarangService();

export default barangService;
