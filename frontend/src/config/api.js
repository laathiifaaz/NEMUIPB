const rawApiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

export const API_BASE_URL = rawApiBaseUrl
  .replace(/^http:\/\/(.+\.up\.railway\.app)$/i, "https://$1")
  .replace(/\/$/, "");