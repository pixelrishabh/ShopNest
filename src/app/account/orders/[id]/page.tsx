import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPaise } from "@/lib/money";
import { FileText, ArrowLeft, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?callbackUrl=/account/orders/${params.id}`);
  }

  const order = await db.order.findFirst({
    where: {
      OR: [{ id: params.id }, { orderNumber: params.id }],
    },
    include: {
      items: true,
      payments: true,
      shipments: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) {
    notFound();
  }

  const addr: any = order.shippingAddressSnapshot || {};
  const isCancellable = ["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(order.status);
  const isReturnable = order.status === "DELIVERED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb & Invoice Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 font-semibold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Order Details <span className="text-slate-500 font-normal">#{order.orderNumber}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>

        <a
          href={`/api/orders/${order.id}/invoice`}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow"
        >
          <FileText className="w-4 h-4" /> Download Tax Invoice (PDF)
        </a>
      </div>

      {/* Status Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Order Status Timeline</h2>
        <div className="space-y-3">
          {order.statusHistory.map((hist, index) => (
            <div key={hist.id} className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                ✓
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{hist.newStatus}</p>
                {hist.reason && <p className="text-slate-600">{hist.reason}</p>}
                <p className="text-[10px] text-slate-400">
                  {new Date(hist.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addresses and Payment Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">Shipping Address</h3>
          <p className="font-bold text-slate-900">{addr.fullName} (Phone: {addr.phone})</p>
          <p className="text-slate-600">{addr.addressLine1}</p>
          {addr.addressLine2 && <p className="text-slate-600">{addr.addressLine2}</p>}
          <p className="font-medium text-slate-800">{addr.city}, {addr.state} - {addr.postalCode}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">Payment Summary</h3>
          <p className="text-slate-600">Method: <strong className="text-slate-900">{order.paymentMethod}</strong></p>
          <p className="text-slate-600">Status: <strong className="text-slate-900">{order.paymentStatus}</strong></p>
          <p className="text-slate-600">Subtotal: <strong className="text-slate-900">{formatPaise(order.subtotal)}</strong></p>
          {order.discount > 0 && (
            <p className="text-red-700">Discount: -{formatPaise(order.discount)}</p>
          )}
          <p className="text-slate-600">Shipping: {order.shippingFee === 0 ? "FREE" : formatPaise(order.shippingFee)}</p>
          <p className="text-xs text-slate-400">GST Included: {formatPaise(order.taxAmount)}</p>
          <p className="text-base font-black text-slate-900 pt-2 border-t">
            Grand Total: {formatPaise(order.grandTotal)}
          </p>
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Items in this shipment</h3>
        <div className="divide-y divide-slate-100 space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="pt-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 bg-slate-50 rounded-lg overflow-hidden border p-1 flex-shrink-0">
                  <Image
                    src={item.imageSnapshot || `/images/products/${item.sku}.svg`}
                    alt={item.productName}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.productName}</p>
                  <p className="text-slate-500">SKU: {item.sku} • Variant: {item.variantName}</p>
                  <p className="text-slate-600 mt-1">Quantity: {item.quantity} × {formatPaise(item.unitPrice)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-slate-900">{formatPaise(item.totalPrice)}</p>
                <p className="text-[10px] text-slate-400">{item.gstRate}% GST included</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
