import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/server/utils/response";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("INVALID_EMAIL", "Please provide a valid email address.", 400);
    }
    // In a full system, store in NewsletterSubscriber table or Sendgrid/Resend list
    return jsonSuccess({ success: true, message: "Subscribed successfully" });
  } catch {
    return jsonError("ERROR", "Failed to subscribe", 500);
  }
}
