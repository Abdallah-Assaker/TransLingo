// This file might still be used for base configuration, but token injection happens elsewhere.
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api", // Fallback URL
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Helper function to get authenticated headers.
 * This should be called within server-side functions only.
 * @param token The JWT token from the NextAuth session.
 * @param contentType The content type for the request.
 */
export const getAuthenticatedHeaders = (
  token?: string,
  contentType: string = "application/json"
): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export default apiClient;
