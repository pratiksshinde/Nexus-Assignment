import { NextRequest, NextResponse } from "next/server";

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nexus-assignment-rlf7.onrender.com/api"
).replace(/\/api\/?$/, "");

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(`/api/${path.join("/")}${request.nextUrl.search}`, backendUrl);
  const token = request.cookies.get("access_token")?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  const authToken = data?.data?.token;

  if (authToken && ["login", "register"].includes(path.at(-1) || "")) {
    delete data.data.token;
  }

  const nextResponse = response.status === 204
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json(data, { status: response.status });

  if (authToken) {
    nextResponse.cookies.set("access_token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    delete data.data.token;
  }

  if (path.at(-1) === "logout") {
    nextResponse.cookies.delete("access_token");
  }

  return nextResponse;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
