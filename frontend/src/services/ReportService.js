import AuthService from "./AuthService";
import { API_BASE_URL } from "../config/api";

class ReportService {

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async getMyReports() {

    try {

      const response = await fetch(
        `${this.baseUrl}/laporan/kehilangan/me`,
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
        `${this.baseUrl}/laporan/kehilangan`,
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

const reportService = new ReportService();

export default reportService;
