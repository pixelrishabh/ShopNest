import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/server/services/audit";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.nativeEnum(OrderStatus),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("FORBIDDEN", "Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const q = searchParams.get("q")?.trim();

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orders = await db.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonSuccess({ orders });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("FORBIDDEN", "Forbidden", 403);

  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { orderId, status, reason } = parsed.data;

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return jsonError("NOT_FOUND", "Order not found", 404);

    const prevStatus = order.status;

    // Execute state update in transaction
    const updatedOrder = await db.$transaction(async (tx) => {
      let nextPaymentStatus = order.paymentStatus;

      // If COD order marked DELIVERED, cash was collected
      if (order.paymentMethod === "COD" && status === OrderStatus.DELIVERED) {
        nextPaymentStatus = PaymentStatus.CAPTURED;
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: PaymentStatus.CAPTURED },
        });
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          paymentStatus: nextPaymentStatus,
          statusHistory: {
            create: {
              previousStatus: prevStatus,
              newStatus: status,
              reason: reason || `Status updated by Admin ${user.name}`,
              changedByUserId: user.id,
            },
          },
        },
      });

      return updated;
    });

    // Write to AuditLog
    await createAuditLog({
      adminId: user.id,
      action: "UPDATE_ORDER_STATUS",
      entityType: "ORDER",
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        previousStatus: prevStatus,
        newStatus: status,
        reason,
      },
      req,
    });

    return jsonSuccess({ order: updatedOrder });
  } catch (err: any) {
    console.error("Order status update error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to update order status", 500);
  }
}
