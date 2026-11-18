import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPaise } from "@/lib/money";
import { Package, FileText, ChevronRight, AlertCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", bg: "bg-amber-100", text: "text-amber-800" },
  PAID: { label: "Paid", bg: "bg-emerald-100", text: "text-emerald-800" },
  PROCESSING: { label: "Processing", bg: "bg-blue-100", text: "text-blue-800" },
  SHIPPED: { label: "Shipped", bg: "bg-indigo-100", text: "text-indigo-800" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-100", text: "text-emerald-800" },
  PAYMENT_FAILED: { label: "Payment Failed", bg: "bg-red-100", text: "text-red-800" },
  CANCELLED: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-800" },
  REFUND_PENDING: { label: "Refund Pending", bg: "bg-purple-100", text: "text-purple-800" },
  REFUNDED: { label: "Refunded", bg: "bg-purple-100", text: "text-purple-800" },
};

export default async function OrdersHistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?callbackUrl=/account/orders");
  }

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      shipments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Your Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track shipments, download tax invoices, and request returns
          </p>
        </div>
        <Link
          href="/catalog"
          className="text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-lg"
        >
          Buy Again
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse our catalog and enjoy Indian festive deals, fast delivery, and GST invoices.
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-[#ffd814] text-slate-950 font-bold px-6 py-2 rounded-xl text-xs"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const badge = STATUS_BADGES[order.status] || {
              label: order.status,
              bg: "bg-slate-100",
              text: "text-slate-700",
            };
            const firstItem = order.items[0];

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* Order Top Strip */}
                <div className="bg-slate-50 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap gap-6 text-slate-600">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Order Placed</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Total</span>
                      <span className="font-bold text-slate-900">{formatPaise(order.grandTotal)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Payment</span>
                      <span className="font-semibold text-slate-800">
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">Order # {order.orderNumber}</span>
                    <a
                      href={`/api/orders/${order.id}/invoice`}
                      className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </a>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      {order.status === "DELIVERED" && (
                        <span className="text-xs text-slate-500 font-medium">Package was handed to customer</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="relative w-16 h-16 bg-slate-50 rounded-lg overflow-hidden border p-1 flex-shrink-0">
                            <Image
                              src={item.imageSnapshot || `/images/products/${item.sku}.svg`}
                              alt={item.productName}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 line-clamp-1">{item.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              Qty: {item.quantity} • {formatPaise(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-2 w-full md:w-48">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="w-full text-center py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition"
                    >
                      View Order Details
                    </Link>

                    <a
                      href={`/api/orders/${order.id}/invoice`}
                      className="w-full text-center py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Download PDF
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
