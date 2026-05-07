// src/services/ApiService.js (Base Class)
class ApiService {
  constructor() {
    this.baseUrl = "http://localhost:8000"; // Sesuaikan dengan URL FastAPI-mu
  }
}

// src/services/BarangService.js
import ApiService from './ApiService';

class BarangService extends ApiService {
  async getAllBarang() {
    const res = await fetch(`${this.baseUrl}/barang`);
    return res.json();
  }

  async filterBarang(params) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${this.baseUrl}/barang/filter?${query}`);
    return res.json();
  }

  async klaimBarang(barangId, klaimData) {
    const res = await fetch(`${this.baseUrl}/barang/${barangId}/klaim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(klaimData)
    });
    return res.json();
  }
}

export default new BarangService();