"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, FileText, ArrowRight, Clock } from "lucide-react";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "SN-2026-0001";
  const status = searchParams.get("status") || "confirmed";

  const isPaid = status === "paid";
  const isFailed = status === "payment_failed";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-lg space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          {isPaid || status === "confirmed" ? (
            <CheckCircle2 className="w-12 h-12" />
          ) : (
            <Clock className="w-12 h-12 text-amber-500" />
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            {isPaid ? "Payment Successful" : "Order Placed Successfully"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Thank you for shopping with ShopNest!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Your order <strong className="text-slate-900">{orderNumber}</strong> has been received and is being prepared for dispatch.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <Link
            href="/account/orders"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow"
          >
            <Package className="w-4 h-4" /> View Your Orders
          </Link>

          <Link
            href="/catalog"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
