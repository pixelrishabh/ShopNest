import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder_webhook_secret";

    if (!signature) {
      return jsonError("MISSING_SIGNATURE", "Missing X-Razorpay-Signature header", 400);
    }

    // Verify webhook HMAC SHA256 signature using timingSafeEqual
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8")
      );

    if (!isValid) {
      console.warn("Invalid webhook signature received");
      return jsonError("INVALID_SIGNATURE", "Invalid webhook signature", 400);
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // Deduplicate event using PaymentEvent table
    const existingEvent = await db.paymentEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`Duplicate webhook event ${eventId} received. Returning 200.`);
      return jsonSuccess({ status: "already_processed" }, 200);
    }

    // Record PaymentEvent
    await db.paymentEvent.create({
      data: {
        eventId,
        eventType,
        payload,
      },
    });

    // Handle supported Razorpay webhook events
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;

    if (razorpayOrderId) {
      const order = await db.order.findFirst({
        where: {
          payments: {
            some: { razorpayOrderId },
          },
        },
      });

      if (order) {
        if (eventType === "payment.captured" || eventType === "order.paid") {
          await db.$transaction(async (tx) => {
            await tx.payment.updateMany({
              where: { razorpayOrderId },
              data: {
                status: PaymentStatus.CAPTURED,
                razorpayPaymentId: paymentEntity?.id || undefined,
                rawResponse: paymentEntity || orderEntity,
              },
            });

            if (order.status !== OrderStatus.PAID) {
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
                      reason: `Webhook: ${eventType} received`,
                    },
                  },
                },
              });
            }
          });
        } else if (eventType === "payment.failed") {
          await db.$transaction(async (tx) => {
            await tx.payment.updateMany({
              where: { razorpayOrderId },
              data: {
                status: PaymentStatus.FAILED,
                rawResponse: paymentEntity,
              },
            });

            await tx.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.PAYMENT_FAILED,
                paymentStatus: PaymentStatus.FAILED,
                statusHistory: {
                  create: {
                    previousStatus: order.status,
                    newStatus: OrderStatus.PAYMENT_FAILED,
                    reason: `Webhook: Payment failed (${paymentEntity?.error_description || "Declined"})`,
                  },
                },
              },
            });
          });
        } else if (eventType === "refund.processed") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.REFUNDED,
              paymentStatus: PaymentStatus.REFUNDED,
              statusHistory: {
                create: {
                  previousStatus: order.status,
                  newStatus: OrderStatus.REFUNDED,
                  reason: "Webhook: Refund processed by Razorpay",
                },
              },
            },
          });
        }
      }
    }

    return jsonSuccess({ status: "processed", event: eventType }, 200);
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return jsonError("WEBHOOK_ERROR", err.message || "Failed to process webhook", 500);
  }
}
