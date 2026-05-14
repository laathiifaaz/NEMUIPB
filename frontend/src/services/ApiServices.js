import AuthService from "./AuthService";

class ApiService {
  constructor() {
    this.baseUrl = "http://127.0.0.1:8000";
  }

  getAuthHeaders() {
    return AuthService.getAuthHeaders();
  }

  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Terjadi kesalahan pada server");
    }

    return data;
  }

async postBarang(data) {
    const response = await fetch(`${this.baseUrl}/barang`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Gagal kirim data");
    }

    return result;
  }
}

export default ApiService;