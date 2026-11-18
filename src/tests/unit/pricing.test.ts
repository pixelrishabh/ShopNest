import { describe, it, expect } from "vitest";
import { calculateOrderTotals, FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "../../server/services/pricing";

describe("Pricing Service", () => {
  it("calculates totals for multiple items with free shipping over threshold", () => {
    const items = [
      { variantId: "v1", unitPrice: 30000, quantity: 2, gstRate: 18 }, // 60000 paise (₹600)
    ];

    const result = calculateOrderTotals(items, "MH");
    expect(result.subtotal).toBe(60000);
    expect(result.shippingFee).toBe(0); // ₹600 >= ₹499 threshold
    expect(result.grandTotal).toBe(60000);
    expect(result.isInterstate).toBe(false);
    expect(result.totalCgst + result.totalSgst).toBe(result.totalTax);
  });

  it("adds standard shipping fee when subtotal is below threshold", () => {
    const items = [
      { variantId: "v1", unitPrice: 25000, quantity: 1, gstRate: 18 }, // ₹250
    ];

    const result = calculateOrderTotals(items, "MH");
    expect(result.subtotal).toBe(25000);
    expect(result.shippingFee).toBe(STANDARD_SHIPPING_FEE_PAISE); // ₹40
    expect(result.grandTotal).toBe(25000 + STANDARD_SHIPPING_FEE_PAISE);
  });

  it("applies valid coupon discount and computes final grand total", () => {
    const items = [
      { variantId: "v1", unitPrice: 100000, quantity: 1, gstRate: 18 }, // ₹1000
    ];
    const coupon = {
      id: "c1",
      code: "WELCOME10",
      type: "PERCENTAGE" as const,
      value: 10,
      minOrderAmount: 50000,
      maxDiscount: 20000,
    };

    const result = calculateOrderTotals(items, "MH", coupon);
    expect(result.subtotal).toBe(100000);
    expect(result.discount).toBe(10000); // 10% of 100000 = 10000
    expect(result.shippingFee).toBe(0);
    expect(result.grandTotal).toBe(90000); // 100000 - 10000
  });

  it("handles empty items array gracefully", () => {
    const result = calculateOrderTotals([], "MH");
    expect(result.subtotal).toBe(0);
    expect(result.shippingFee).toBe(0);
    expect(result.grandTotal).toBe(0);
  });
});
