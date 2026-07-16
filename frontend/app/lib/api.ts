const TOKEN_KEY = "access_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nexus-assignment-rlf7.onrender.com/api";

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(30000),
    credentials: "include",
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    if (response.status === 401) setAuthToken(null);
    throw new Error(data?.message || "Request failed");
  }
  return data;
}
