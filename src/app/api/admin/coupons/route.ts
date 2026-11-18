import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/server/services/audit";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import { CouponType } from "@prisma/client";

const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase().trim(),
  type: z.nativeEnum(CouponType),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().default(1),
  validDays: z.number().int().positive().default(30),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("FORBIDDEN", "Forbidden", 403);

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  return jsonSuccess({ coupons });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("FORBIDDEN", "Forbidden", 403);

  try {
    const body = await req.json();
    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const data = parsed.data;

    const existing = await db.coupon.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return jsonError("CODE_EXISTS", "A coupon with this code already exists.", 409);
    }

    const validFrom = new Date();
    const validUntil = new Date(Date.now() + data.validDays * 24 * 60 * 60 * 1000);

    const coupon = await db.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        perUserLimit: data.perUserLimit,
        validFrom,
        validUntil,
        isActive: true,
      },
    });

    await createAuditLog({
      adminId: user.id,
      action: "CREATE_COUPON",
      entityType: "COUPON",
      entityId: coupon.id,
      details: { code: coupon.code, type: coupon.type, value: coupon.value },
      req,
    });

    return jsonSuccess({ coupon }, 201);
  } catch (err: any) {
    return jsonError("INTERNAL_ERROR", "Failed to create coupon", 500);
  }
}
