import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateInvoicePdf } from "@/server/services/invoice-generator";
import { jsonError } from "@/server/utils/response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("UNAUTHORIZED", "Please sign in to view invoice", 401);
    }

    // Lookup order by either cuid id OR human-readable orderNumber
    const order = await db.order.findFirst({
      where: {
        OR: [{ id: params.id }, { orderNumber: params.id }],
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return jsonError("NOT_FOUND", "Order not found", 404);
    }

    // Ownership or Admin authorization check (prevents IDOR)
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return jsonError("FORBIDDEN", "You are not authorized to access this invoice.", 403);
    }

    // Generate PDF using pdf-lib
    const pdfBytes = await generateInvoicePdf({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      grandTotal: order.grandTotal,
      shippingAddressSnapshot: order.shippingAddressSnapshot,
      billingAddressSnapshot: order.billingAddressSnapshot,
      items: order.items.map((i) => ({
        productName: i.productName,
        sku: i.sku,
        variantName: i.variantName,
        unitPrice: i.unitPrice,
        gstRate: i.gstRate,
        taxAmount: i.taxAmount,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
      payments: order.payments.map((p) => ({
        provider: p.provider,
        razorpayPaymentId: p.razorpayPaymentId,
        status: p.status,
      })),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Invoice generation error:", err);
    return jsonError("INVOICE_ERROR", "Failed to generate invoice PDF", 500);
  }
}
