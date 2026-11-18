import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // Fetch order and verify ownership
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: { payments: true },
    });

    if (!order) {
      return jsonError("ORDER_NOT_FOUND", "Order not found or unauthorized access.", 404);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";

    // Verify Razorpay HMAC SHA256 signature using constant-time comparison
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    const isSignatureValid =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      );

    if (!isSignatureValid) {
      console.error("Tampered payment signature detected for order:", orderId);
      // Mark payment failed
      await db.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAYMENT_FAILED,
          paymentStatus: PaymentStatus.FAILED,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: OrderStatus.PAYMENT_FAILED,
              reason: "Invalid / tampered payment signature",
              changedByUserId: user.id,
            },
          },
        },
      });

      return jsonError("INVALID_SIGNATURE", "Payment verification failed. Invalid signature.", 400);
    }

    // Payment Signature is Valid - Transition Order to PAID
    await db.$transaction(async (tx) => {
      // Update Payment record
      await tx.payment.upsert({
        where: { razorpayOrderId: razorpay_order_id },
        update: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: PaymentStatus.CAPTURED,
        },
        create: {
          orderId: order.id,
          provider: "RAZORPAY",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          amount: order.grandTotal,
          status: PaymentStatus.CAPTURED,
        },
      });

      // Update Order status to PAID and clear stockReservedUntil
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.CAPTURED,
          stockReservedUntil: null,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: OrderStatus.PAID,
              reason: `Payment captured via Razorpay (Payment ID: ${razorpay_payment_id})`,
              changedByUserId: user.id,
            },
          },
        },
      });
    });

    return jsonSuccess({
      success: true,
      message: "Payment successfully verified and order marked as PAID.",
      orderNumber: order.orderNumber,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return jsonError("INTERNAL_ERROR", "Internal verification error.", 500);
  }
}
