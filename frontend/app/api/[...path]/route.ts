import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nexus-assignment-rlf7.onrender.com/api"
).replace(/\/api\/?$/, "");

const backendClient = axios.create({
  baseURL: `${backendUrl}/api`,
  timeout: 30000,
  validateStatus: () => true,
  maxBodyLength: Infinity,
});

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const token = request.cookies.get("access_token")?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const response = await backendClient.request({
    url: `/${path.join("/")}${request.nextUrl.search}`,
    method: request.method,
    headers: Object.fromEntries(headers),
    data: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : Buffer.from(await request.arrayBuffer()),
  });
  const data = response.data;
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
