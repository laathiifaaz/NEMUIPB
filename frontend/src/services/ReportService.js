import AuthService from "./AuthService";

class ReportService {

  constructor() {
    this.baseUrl = "http://127.0.0.1:8000";
  }

  async getMyReports() {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/laporan/kehilangan/me",
        {
          method: "GET",

          headers:
            AuthService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Gagal mengambil laporan"
        );
      }

      const data =
        await response.json();

      return data;

    } catch (error) {

      console.error(error);

      return [];
    }
  }

  // TARUH DI SINI
  async createLostReport(formData) {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/laporan/kehilangan",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },

          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Gagal membuat laporan"
        );
      }

      return data;

    } catch (error) {

      console.error(error);
      throw error;
    }
  }
}

export default new ReportService();