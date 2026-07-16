const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function api(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(30000),
    credentials: "include",
    headers: isFormData ? options.headers : { "Content-Type": "application/json", ...options.headers },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}
