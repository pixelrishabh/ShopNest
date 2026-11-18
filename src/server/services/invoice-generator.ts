import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatPaiseForPdf } from "@/lib/money";

export interface InvoiceOrderData {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;       // in paise
  discount: number;       // in paise
  shippingFee: number;    // in paise
  taxAmount: number;      // in paise
  grandTotal: number;     // in paise
  shippingAddressSnapshot: any;
  billingAddressSnapshot?: any;
  items: Array<{
    productName: string;
    sku: string;
    variantName: string;
    unitPrice: number;    // in paise
    gstRate: number;      // percent
    taxAmount: number;    // in paise
    quantity: number;
    totalPrice: number;   // in paise
  }>;
  payments?: Array<{
    provider: string;
    razorpayPaymentId?: string | null;
    status: string;
  }>;
}

export async function generateInvoicePdf(order: InvoiceOrderData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 40;

  // Seller Details
  const storeName = process.env.SELLER_STORE_NAME || "ShopNest Retail Private Limited";
  const sellerGstin = process.env.SELLER_GSTIN || "27AAACS1234A1Z5";
  const sellerState = process.env.SELLER_STATE || "MH";

  const isPaid = order.paymentStatus === "CAPTURED" || order.status === "DELIVERED";
  const docTitle = isPaid ? "TAX INVOICE" : "ORDER SUMMARY / PROFORMA";
  const invoiceNumber = `INV/${order.orderNumber}`;

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 50,
    width: width - 80,
    height: 55,
    color: rgb(0.07, 0.1, 0.13), // #131921 ShopNest Navy
  });

  page.drawText("ShopNest", {
    x: 55,
    y: y - 28,
    size: 22,
    font: fontBold,
    color: rgb(0.99, 0.74, 0.41), // #febd69 ShopNest Gold
  });

  page.drawText("India's Trusted Online Marketplace", {
    x: 55,
    y: y - 44,
    size: 9,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText(docTitle, {
    x: width - 260,
    y: y - 28,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Status: ${isPaid ? "PAID" : "PAYMENT PENDING"}`, {
    x: width - 260,
    y: y - 44,
    size: 9,
    font: fontBold,
    color: isPaid ? rgb(0.2, 0.8, 0.4) : rgb(0.95, 0.6, 0.1),
  });

  y -= 70;

  // Metadata Grid
  const leftX = 40;
  const rightX = 320;

  // Seller Info
  page.drawText("SOLD BY:", { x: leftX, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  y -= 14;
  page.drawText(storeName, { x: leftX, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  y -= 12;
  page.drawText(`GSTIN: ${sellerGstin} | State Code: ${sellerState}`, { x: leftX, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  y -= 12;
  page.drawText("Support: support@shopnest.in | www.shopnest.in", { x: leftX, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // Invoice & Order Info
  let metaY = y + 38;
  page.drawText(`Invoice No: ${invoiceNumber}`, { x: rightX, y: metaY, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  metaY -= 14;
  page.drawText(`Order No: ${order.orderNumber}`, { x: rightX, y: metaY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  metaY -= 12;
  page.drawText(`Order Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { x: rightX, y: metaY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  metaY -= 12;
  page.drawText(`Payment Method: ${order.paymentMethod} (${order.paymentStatus})`, { x: rightX, y: metaY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

  y -= 25;

  // Addresses
  const addr = order.shippingAddressSnapshot || {};
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: width - 80,
    height: 60,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText("SHIPPING & BILLING ADDRESS:", { x: 50, y: y - 14, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`${addr.fullName || "Customer"} | Phone: ${addr.phone || "N/A"}`, { x: 50, y: y - 26, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText(`${addr.addressLine1 || ""}, ${addr.addressLine2 || ""}`, { x: 50, y: y - 38, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`${addr.city || ""}, ${addr.state || ""}, PIN: ${addr.postalCode || ""}`, { x: 50, y: y - 50, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  y -= 80;

  // Items Table Header
  page.drawRectangle({
    x: 40,
    y: y - 18,
    width: width - 80,
    height: 22,
    color: rgb(0.9, 0.93, 0.96),
  });

  page.drawText("#", { x: 45, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Description", { x: 65, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Qty", { x: 310, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Gross Unit", { x: 345, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("GST", { x: 420, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Total", { x: 490, y: y - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  y -= 26;

  // Table Items
  order.items.forEach((item, index) => {
    page.drawText(`${index + 1}`, { x: 45, y, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    
    const desc = `${item.productName} (${item.variantName})`.slice(0, 48);
    page.drawText(desc, { x: 65, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawText(`${item.quantity}`, { x: 315, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawText(formatPaiseForPdf(item.unitPrice), { x: 345, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
    page.drawText(`${item.gstRate}%`, { x: 420, y, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(formatPaiseForPdf(item.totalPrice), { x: 485, y, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    
    y -= 16;
  });

  // Divider line
  page.drawLine({
    start: { x: 40, y: y + 4 },
    end: { x: width - 40, y: y + 4 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 10;

  // Summary Totals
  const summaryX = 345;
  const valX = 485;

  page.drawText("Subtotal (Gross):", { x: summaryX, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(formatPaiseForPdf(order.subtotal), { x: valX, y, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  y -= 14;

  if (order.discount > 0) {
    page.drawText("Discount Applied:", { x: summaryX, y, size: 9, font: fontRegular, color: rgb(0.7, 0.1, 0.1) });
    page.drawText(`-${formatPaiseForPdf(order.discount)}`, { x: valX, y, size: 9, font: fontBold, color: rgb(0.7, 0.1, 0.1) });
    y -= 14;
  }

  page.drawText("Shipping Charges:", { x: summaryX, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(order.shippingFee === 0 ? "FREE" : formatPaiseForPdf(order.shippingFee), { x: valX, y, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
  y -= 14;

  const isInterstate = (addr.state || "").toUpperCase() !== sellerState.toUpperCase();
  page.drawText(`Tax Included in Total (${isInterstate ? "IGST" : "CGST + SGST"}):`, { x: summaryX - 45, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(formatPaiseForPdf(order.taxAmount), { x: valX, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  y -= 16;

  // Grand Total Highlight Box
  page.drawRectangle({
    x: summaryX - 10,
    y: y - 8,
    width: width - summaryX - 30,
    height: 24,
    color: rgb(0.96, 0.94, 0.88),
    borderColor: rgb(0.95, 0.65, 0.1),
    borderWidth: 1,
  });

  page.drawText("Grand Total:", { x: summaryX, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText(formatPaiseForPdf(order.grandTotal), { x: valX, y, size: 11, font: fontBold, color: rgb(0.7, 0.15, 0) });

  y -= 50;

  // Return Policy and Footer
  page.drawText("Return & Cancellation Policy:", { x: 40, y, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  y -= 12;
  page.drawText("• Returns allowed within 7 days of delivery for eligible verified products in original packaging.", { x: 40, y, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  y -= 10;
  page.drawText("• For prepaid orders, refunds are credited back to the original payment source via Razorpay within 5-7 business days.", { x: 40, y, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  y -= 10;
  page.drawText("• This is a computer-generated invoice and requires no physical signature.", { x: 40, y, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  return pdfDoc.save();
}
