import { describe, it, expect } from "vitest";
import {
  formatPaise,
  rupeesToPaise,
  paiseToRupees,
  calculateInclusiveGst,
  calculateCouponDiscount,
} from "../../lib/money";

describe("Money Utilities", () => {
  it("formats paise to Indian Rupee format", () => {
    expect(formatPaise(149900)).toBe("₹1,499.00");
    expect(formatPaise(49900, false)).toBe("₹499");
    expect(formatPaise(0)).toBe("₹0.00");
  });

  it("converts rupees to paise and vice versa", () => {
    expect(rupeesToPaise(1499)).toBe(149900);
    expect(paiseToRupees(149900)).toBe(1499);
  });

  it("calculates intrastate GST breakdown (CGST + SGST)", () => {
    // 11800 paise gross with 18% GST in MH (seller is MH)
    // taxable = round(11800 * 100 / 118) = 10000 paise
    // tax = 1800 paise -> CGST = 900 paise, SGST = 900 paise
    const result = calculateInclusiveGst(11800, 18, "MH", "MH");
    expect(result.isInterstate).toBe(false);
    expect(result.taxableAmount).toBe(10000);
    expect(result.taxAmount).toBe(1800);
    expect(result.cgst).toBe(900);
    expect(result.sgst).toBe(900);
    expect(result.igst).toBe(0);
  });

  it("calculates interstate GST breakdown (IGST only)", () => {
    // 11800 paise gross with 18% GST shipped to KA (seller is MH)
    const result = calculateInclusiveGst(11800, 18, "KA", "MH");
    expect(result.isInterstate).toBe(true);
    expect(result.taxableAmount).toBe(10000);
    expect(result.taxAmount).toBe(1800);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(1800);
  });

  it("applies percentage coupon discounts correctly with cap", () => {
    // 10% coupon on 200000 paise (₹2000) with maxDiscount 15000 paise (₹150)
    const coupon = {
      type: "PERCENTAGE" as const,
      value: 10,
      minOrderAmount: 50000,
      maxDiscount: 15000,
    };

    const discount = calculateCouponDiscount(200000, coupon);
    expect(discount).toBe(15000); // capped at 15000 instead of 20000
  });

  it("rejects coupon if order subtotal is below minimum order amount", () => {
    const coupon = {
      type: "FLAT" as const,
      value: 20000,
      minOrderAmount: 99900,
      maxDiscount: null,
    };

    const discount = calculateCouponDiscount(50000, coupon);
    expect(discount).toBe(0);
  });
});
