import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/server/services/audit";
import { jsonSuccess, jsonError } from "@/server/utils/response";

const toggleSuspendSchema = z.object({
  customerId: z.string().min(1),
  isSuspended: z.boolean(),
  reason: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("FORBIDDEN", "Forbidden", 403);

  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isSuspended: true,
      createdAt: true,
      _count: {
        select: { orders: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess({ customers });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("FORBIDDEN", "Forbidden", 403);

  try {
    const body = await req.json();
    const parsed = toggleSuspendSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { customerId, isSuspended, reason } = parsed.data;

    const targetCustomer = await db.user.findUnique({
      where: { id: customerId },
    });

    if (!targetCustomer) {
      return jsonError("NOT_FOUND", "Customer not found", 404);
    }

    const updated = await db.user.update({
      where: { id: customerId },
      data: { isSuspended },
    });

    // Record in AuditLog
    await createAuditLog({
      adminId: user.id,
      action: isSuspended ? "SUSPEND_CUSTOMER" : "UNSUSPEND_CUSTOMER",
      entityType: "USER",
      entityId: customerId,
      details: {
        customerEmail: targetCustomer.email,
        isSuspended,
        reason: reason || "Administrative action",
      },
      req,
    });

    return jsonSuccess({
      message: `Customer ${isSuspended ? "suspended" : "reactivated"} successfully.`,
      customer: updated,
    });
  } catch (err: any) {
    return jsonError("INTERNAL_ERROR", "Failed to update customer status", 500);
  }
}
