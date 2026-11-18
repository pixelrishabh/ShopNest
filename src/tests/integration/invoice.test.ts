import { describe, it, expect } from "vitest";
import { generateInvoicePdf } from "@/server/services/invoice-generator";
import { db } from "@/lib/db";

describe("Invoice PDF Generation Integration Tests", () => {
  it("generates a valid binary PDF document for an order", async () => {
    const sampleOrder = await db.order.findFirst({
      where: { orderNumber: "SN-2026-0001" },
      include: { items: true, payments: true },
    });

    expect(sampleOrder).not.toBeNull();
    if (!sampleOrder) return;

    const pdfBuffer = await generateInvoicePdf({
      orderNumber: sampleOrder.orderNumber,
      createdAt: sampleOrder.createdAt,
      status: sampleOrder.status,
      paymentMethod: sampleOrder.paymentMethod,
      paymentStatus: sampleOrder.paymentStatus,
      subtotal: sampleOrder.subtotal,
      discount: sampleOrder.discount,
      shippingFee: sampleOrder.shippingFee,
      taxAmount: sampleOrder.taxAmount,
      grandTotal: sampleOrder.grandTotal,
      shippingAddressSnapshot: sampleOrder.shippingAddressSnapshot,
      items: sampleOrder.items.map((i) => ({
        productName: i.productName,
        sku: i.sku,
        variantName: i.variantName,
        unitPrice: i.unitPrice,
        gstRate: i.gstRate,
        taxAmount: i.taxAmount,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
      payments: sampleOrder.payments.map((p) => ({
        provider: p.provider,
        status: p.status,
      })),
    });

    // Check PDF magic header '%PDF-'
    const magicHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString("utf-8");
    expect(magicHeader).toBe("%PDF-");
    expect(pdfBuffer.length).toBeGreaterThan(2000); // realistic PDF size
  });
});
