import ApiService from "./ApiServices";

class NotifikasiService extends ApiService {
  async getNotifikasi() {
    const res = await fetch(`${this.baseUrl}/notifikasi/`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }

  async markAsRead(notifikasiId) {
    const res = await fetch(`${this.baseUrl}/notifikasi/${notifikasiId}/read`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(res);
  }
}

const notifikasiService = new NotifikasiService();

export default notifikasiService;
