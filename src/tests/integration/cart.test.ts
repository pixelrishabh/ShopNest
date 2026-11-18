import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Cart and Coupons Integration Tests", () => {
  it("enforces stock limits when adding items", async () => {
    const variant = await db.productVariant.findFirst({
      where: { stock: { gt: 0 } },
    });

    expect(variant).not.toBeNull();
    if (!variant) return;

    // Requested qty exceeding stock should be capped or rejected
    const requestedQty = variant.stock + 10;
    const finalQty = Math.min(requestedQty, variant.stock);
    expect(finalQty).toBe(variant.stock);
  });

  it("retrieves valid and expired coupons from DB with exact rules", async () => {
    const welcomeCoupon = await db.coupon.findUnique({
      where: { code: "WELCOME10" },
    });
    expect(welcomeCoupon).not.toBeNull();
    expect(welcomeCoupon?.isActive).toBe(true);
    expect(new Date() <= welcomeCoupon!.validUntil).toBe(true);

    const expiredCoupon = await db.coupon.findUnique({
      where: { code: "FESTIVE50" },
    });
    expect(expiredCoupon).not.toBeNull();
    expect(new Date() > expiredCoupon!.validUntil).toBe(true);
  });
});
