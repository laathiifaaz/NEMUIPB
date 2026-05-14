class AuthService {

  constructor() {
    this.baseUrl = "http://127.0.0.1:8000";
  }

  async login(username, password) {

    const response = await fetch(
      `${this.baseUrl}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    if (!response.ok) {

      const errorData =
        await response.json();

      throw new Error(
        errorData.detail ||
        "Gagal masuk ke sistem"
      );
    }

    const data = await response.json();

    console.log("LOGIN RESPONSE:", data);

    if (
      data.access_token &&
      data.user
    ) {

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "token_type",
        data.token_type
      );

      localStorage.setItem(
        "user_id",
        data.user.user_id
      );

      localStorage.setItem(
        "username",
        data.user.username
      );

      localStorage.setItem(
        "email",
        data.user.email
      );

      localStorage.setItem(
        "role",
        data.user.role
      );
    }

    return data;
  }

  logout() {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "token_type"
    );

    localStorage.removeItem(
      "user_id"
    );

    localStorage.removeItem(
      "username"
    );

    localStorage.removeItem(
      "email"
    );

    localStorage.removeItem(
      "role"
    );
  }

  getToken() {

    return localStorage.getItem(
      "access_token"
    );
  }

  getAuthHeaders() {

    const token = this.getToken();

    return {
      "Content-Type":
        "application/json",

      Authorization:
        `Bearer ${token}`,
    };
  }

  getCurrentUser() {

    return {
      user_id:
        localStorage.getItem("user_id"),

      username:
        localStorage.getItem("username"),

      email:
        localStorage.getItem("email"),

      role:
        localStorage.getItem("role"),

      token:
        localStorage.getItem("access_token"),
    };
  }

  isLoggedIn() {

    const token =
      localStorage.getItem(
        "access_token"
      );

    return (
      token !== null &&
      token !== undefined &&
      token !== ""
    );
  }

  isAdmin() {

    return (
      localStorage.getItem("role") ===
      "admin"
    );
  }
}

const authService =
  new AuthService();

export default authService;