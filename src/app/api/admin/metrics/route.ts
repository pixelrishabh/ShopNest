import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHORIZED", "Please sign in.", 401);
  }
  if (user.role !== "ADMIN") {
    return jsonError("FORBIDDEN", "Admin access required.", 403);
  }

  try {
    // 1. Revenue from paid orders ONLY
    const paidOrders = await db.order.findMany({
      where: {
        OR: [
          { paymentStatus: PaymentStatus.CAPTURED },
          { status: OrderStatus.DELIVERED },
        ],
      },
      select: { grandTotal: true },
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    // 2. Counts
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      paymentFailures,
      lowStockVariants,
      returnRequests,
    ] = await Promise.all([
      db.order.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.product.count({ where: { isPublished: true } }),
      db.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      db.order.count({ where: { status: OrderStatus.PAYMENT_FAILED } }),
      db.productVariant.count({ where: { stock: { lte: 5 } } }),
      db.returnRequest.count({ where: { status: "REQUESTED" } }),
    ]);

    // 3. Recent 5 Orders
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
    });

    return jsonSuccess({
      metrics: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        paymentFailures,
        lowStockCount: lowStockVariants,
        returnRequestsCount: returnRequests,
      },
      recentOrders,
    });
  } catch (err: any) {
    console.error("Admin metrics error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve metrics", 500);
  }
}
