import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { jsonSuccess } from "@/server/utils/response";

export async function POST() {
  const response = jsonSuccess({ message: "Logged out successfully" });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
