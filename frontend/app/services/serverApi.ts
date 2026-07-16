import "server-only";

import { cookies } from "next/headers";

const backendUrl = (
  process.env.BACKEND_URL || "https://nexus-assignment-rlf7.onrender.com"
).replace(/\/api\/?$/, "");

export async function serverApi(path: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) throw new Error("AUTH_REQUIRED");

  const response = await fetch(`${backendUrl}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) throw new Error("AUTH_REQUIRED");
    if (response.status === 404) throw new Error("NOT_FOUND");
    throw new Error("LOAD_FAILED");
  }

  return data;
}
