import "server-only";

import axios from "axios";
import { cookies } from "next/headers";

const backendUrl = (
  process.env.BACKEND_URL || "https://nexus-assignment-rlf7.onrender.com"
).replace(/\/api\/?$/, "");

const serverClient = axios.create({
  baseURL: `${backendUrl}/api`,
  timeout: 30000,
});

serverClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) return Promise.reject(new Error("AUTH_REQUIRED"));
    if (error.response?.status === 404) return Promise.reject(new Error("NOT_FOUND"));
    return Promise.reject(new Error("LOAD_FAILED"));
  },
);

export async function serverApi(path: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) throw new Error("AUTH_REQUIRED");

  return serverClient.get(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
