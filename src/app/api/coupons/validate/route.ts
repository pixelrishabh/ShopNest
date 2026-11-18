import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateCouponDiscount } from "@/lib/money";
import { jsonSuccess, jsonError } from "@/server/utils/response";

const couponSchema = z.object({
  code: z.string().min(1).toUpperCase().trim(),
  subtotal: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { code, subtotal } = parsed.data;

    const coupon = await db.coupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.isActive) {
      return jsonError("INVALID_COUPON", "Coupon code is invalid or inactive.", 400);
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return jsonError("EXPIRED_COUPON", "This coupon has expired.", 400);
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return jsonError("COUPON_LIMIT_EXCEEDED", "This coupon has reached its total usage limit.", 400);
    }

    if (subtotal < coupon.minOrderAmount) {
      return jsonError(
        "MIN_ORDER_NOT_MET",
        `Minimum order amount for coupon ${code} is ₹${coupon.minOrderAmount / 100}.`,
        400
      );
    }

    // Check user limit if logged in
    const user = await getCurrentUser();
    if (user) {
      const userRedemptions = await db.couponRedemption.count({
        where: { couponId: coupon.id, userId: user.id },
      });

      if (userRedemptions >= coupon.perUserLimit) {
        return jsonError(
          "PER_USER_LIMIT_EXCEEDED",
          "You have already redeemed this coupon the maximum allowed times.",
          400
        );
      }
    }

    const discountAmount = calculateCouponDiscount(subtotal, {
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
    });

    return jsonSuccess({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        discountAmount,
      },
    });
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to validate coupon.", 500);
  }
}
