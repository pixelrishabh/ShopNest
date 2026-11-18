import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHORIZED", "Not authenticated", 401);
  }
  return jsonSuccess({ user });
}
