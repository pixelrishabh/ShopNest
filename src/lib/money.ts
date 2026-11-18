/**
 * ShopNest Money & Currency Utilities
 * All financial values are stored in integer paise (1 INR = 100 paise).
 * No floating point math is used in currency calculations.
 */

export interface TaxBreakdown {
  taxableAmount: number; // in paise
  taxAmount: number;     // in paise
  cgst: number;          // in paise
  sgst: number;          // in paise
  igst: number;          // in paise
  isInterstate: boolean;
  rate: number;          // GST % e.g. 18
}

/**
 * Format integer paise into Indian Rupee format (e.g., 149900 -> "₹1,499.00" or "₹1,499")
 */
export function formatPaise(paise: number, includeDecimals = true): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Format integer paise into WinAnsi-safe Indian Rupee format (e.g. "INR 1,499.00")
 * Suitable for PDF generation where standard fonts (Helvetica) lack the Unicode ₹ glyph.
 */
export function formatPaiseForPdf(paise: number, includeDecimals = true): string {
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
  return `INR ${formatted}`;
}

/**
 * Convert rupees to integer paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees (for display only)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Calculate reverse GST breakdown from a GST-inclusive price.
 * Since prices are GST-inclusive:
 * Taxable Amount = (Gross Price * 10000) / (10000 + gstRate * 100)
 * Tax Amount = Gross Price - Taxable Amount
 * 
 * If Intrastate (Shipping State == Seller State):
 * CGST = Tax Amount / 2, SGST = Tax Amount - CGST
 * If Interstate:
 * IGST = Tax Amount
 */
export function calculateInclusiveGst(
  grossPaise: number,
  gstRatePercent: number,
  shippingState: string,
  sellerState: string = process.env.SELLER_STATE || "MH"
): TaxBreakdown {
  if (grossPaise <= 0 || gstRatePercent <= 0) {
    return {
      taxableAmount: grossPaise,
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      isInterstate: false,
      rate: gstRatePercent,
    };
  }

  // Integer math with 100x scaling to preserve exact paise without floats
  // taxableAmount = round((grossPaise * 100) / (100 + gstRate))
  const factor = 100 + gstRatePercent;
  const taxableAmount = Math.round((grossPaise * 100) / factor);
  const taxAmount = grossPaise - taxableAmount;

  const isInterstate = shippingState.trim().toUpperCase() !== sellerState.trim().toUpperCase();

  if (isInterstate) {
    return {
      taxableAmount,
      taxAmount,
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      isInterstate: true,
      rate: gstRatePercent,
    };
  }

  const cgst = Math.floor(taxAmount / 2);
  const sgst = taxAmount - cgst;

  return {
    taxableAmount,
    taxAmount,
    cgst,
    sgst,
    igst: 0,
    isInterstate: false,
    rate: gstRatePercent,
  };
}

/**
 * Calculate discount based on coupon rules
 */
export function calculateCouponDiscount(
  subtotalPaise: number,
  coupon: {
    type: "PERCENTAGE" | "FLAT";
    value: number; // percentage (e.g. 10 for 10%) or paise (e.g. 50000 for ₹500)
    minOrderAmount: number; // paise
    maxDiscount: number | null; // paise
  }
): number {
  if (subtotalPaise < coupon.minOrderAmount) {
    return 0;
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = Math.round((subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }

  return Math.min(discount, subtotalPaise);
}
