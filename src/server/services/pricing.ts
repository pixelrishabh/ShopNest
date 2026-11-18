import { calculateInclusiveGst, calculateCouponDiscount, TaxBreakdown } from "@/lib/money";

export interface PricingInputItem {
  variantId: string;
  unitPrice: number; // paise, GST-inclusive
  quantity: number;
  gstRate: number;   // percent
}

export interface PricingResultItem {
  variantId: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  totalPrice: number; // unitPrice * quantity
  taxBreakdown: TaxBreakdown;
}

export interface CouponData {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
}

export interface PricingResult {
  items: PricingResultItem[];
  subtotal: number;       // total of unitPrice * quantity (in paise)
  discount: number;       // in paise
  shippingFee: number;    // in paise
  totalTax: number;       // in paise (already part of subtotal, but broken down for transparency & invoices)
  totalCgst: number;      // in paise
  totalSgst: number;      // in paise
  totalIgst: number;      // in paise
  grandTotal: number;     // subtotal - discount + shippingFee (in paise)
  isInterstate: boolean;
  freeShippingThreshold: number;
}

export const FREE_SHIPPING_THRESHOLD_PAISE = 49900; // ₹499
export const STANDARD_SHIPPING_FEE_PAISE = 4000;    // ₹40

/**
 * Single source of truth for pricing calculations across Cart, Checkout, Order Creation and Invoices.
 * Server-only computation.
 */
export function calculateOrderTotals(
  items: PricingInputItem[],
  shippingState: string,
  coupon?: CouponData | null
): PricingResult {
  let subtotal = 0;
  let totalTax = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let isInterstate = false;

  const resultItems: PricingResultItem[] = items.map((item) => {
    const totalPrice = item.unitPrice * item.quantity;
    subtotal += totalPrice;

    const taxBreakdown = calculateInclusiveGst(
      totalPrice,
      item.gstRate,
      shippingState
    );

    totalTax += taxBreakdown.taxAmount;
    totalCgst += taxBreakdown.cgst;
    totalSgst += taxBreakdown.sgst;
    totalIgst += taxBreakdown.igst;
    isInterstate = taxBreakdown.isInterstate;

    return {
      variantId: item.variantId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      gstRate: item.gstRate,
      totalPrice,
      taxBreakdown,
    };
  });

  // Calculate coupon discount
  let discount = 0;
  if (coupon && subtotal > 0) {
    discount = calculateCouponDiscount(subtotal, coupon);
  }

  // Calculate shipping fee: Free above threshold or if cart is empty
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;

  // Grand total: subtotal - discount + shipping fee
  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  return {
    items: resultItems,
    subtotal,
    discount,
    shippingFee,
    totalTax,
    totalCgst,
    totalSgst,
    totalIgst,
    grandTotal,
    isInterstate,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD_PAISE,
  };
}
