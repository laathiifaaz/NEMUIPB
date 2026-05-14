class AuthService {
  constructor() {
    // Pastikan ini sesuai dengan port FastAPI kamu (8000)
    this.baseUrl = "http://127.0.0.1:8000";
  }

  async login(username, password) {
    // Kita menembak ke /login sesuai dengan dekorator @app.post("/login") di main.py
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password
      }),
    });

    // Jika response tidak ok (401, 404, 422, dll)
    if (!response.ok) {
      const errorData = await response.json();
      // Menampilkan pesan error spesifik dari FastAPI
      throw new Error(errorData.detail || "Gagal masuk ke sistem");
    }

    const data = await response.json();

    // Simpan data user ke localStorage agar sesi tidak hilang saat refresh
    if (data.user_id) {
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);
    }

    return data;
  }

  logout() {
    localStorage.clear();
  }

  getCurrentUser() {
    return {
      user_id: localStorage.getItem("user_id"),
      username: localStorage.getItem("username"),
      role: localStorage.getItem("role")
    };
  }

  // Di dalam AuthService.js
  async filterBarang(params) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/barang/filter?${queryString}`); // PASTIIN /barang/filter
    return await response.json();
  }

  async searchBarang(keyword) {
    const response = await fetch(`${this.baseUrl}/barang/search?keyword=${keyword}`); // PASTIIN /barang/search
    return await response.json();
  }
}

export default new AuthService();