"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ShieldCheck,
  Tag,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPaise } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "@/server/services/pricing";

export default function CartPage() {
  const router = useRouter();
  const { items, cartCount, subtotal, coupon, loading, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();

  const [couponInput, setCouponInput] = React.useState("");
  const [couponError, setCouponError] = React.useState("");
  const [couponSuccess, setCouponSuccess] = React.useState("");
  const [couponLoading, setCouponLoading] = React.useState(false);

  const discountAmount = coupon ? coupon.discountAmount : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE;
  const shippingFee = subtotal === 0 || isFreeShipping ? 0 : STANDARD_SHIPPING_FEE_PAISE;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponError("");
    setCouponSuccess("");
    setCouponLoading(true);

    const res = await applyCoupon(couponInput.trim().toUpperCase());
    setCouponLoading(false);

    if (res.success) {
      setCouponSuccess(res.message || "Coupon applied!");
      setCouponInput("");
    } else {
      setCouponError(res.message || "Failed to apply coupon.");
    }
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to remove all items from your cart?")) {
      clearCart();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-slate-200 rounded-xl" />
              <div className="h-32 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-64 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm space-y-5">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Your ShopNest Cart is empty</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your shopping cart is waiting for you. Explore our Great Indian Deals and add your favorite electronics, fashion, or groceries.
          </p>
          <div className="pt-2">
            <Link
              href="/catalog?deals=true"
              className="inline-flex items-center gap-2 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow transition"
            >
              Shop Today&apos;s Deals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cartCount} item{cartCount > 1 ? "s" : ""} in your basket
          </p>
        </div>
        <button
          onClick={handleClearCart}
          className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
            >
              <div className="flex gap-4 items-center flex-1">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 rounded-xl overflow-hidden p-2 flex-shrink-0 border border-slate-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.name}</h3>
                  <p className="text-xs text-slate-500">Variant: {item.variantName}</p>
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Prime Assured
                  </p>
                  <p className="text-sm font-black text-slate-900 pt-1">
                    {formatPaise(item.price)}
                    {item.mrp > item.price && (
                      <span className="text-xs text-slate-400 line-through ml-2 font-normal">
                        {formatPaise(item.mrp)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Quantity Picker & Delete */}
              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-xs"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900 bg-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-xs disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.variantId)}
                  className="p-2 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Delivery Note */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <span className="font-semibold">
              {isFreeShipping
                ? "🎉 Your order qualifies for FREE Pan-India Delivery!"
                : `Add ₹${(FREE_SHIPPING_THRESHOLD_PAISE - subtotal) / 100} more of eligible items to get FREE delivery.`}
            </span>
            <span className="text-[10px] text-amber-800">Threshold: ₹499</span>
          </div>
        </div>

        {/* Order Summary & Coupon Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
          <h2 className="text-lg font-black text-slate-900 border-b pb-3">Order Summary</h2>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal ({cartCount} items):</span>
              <span className="font-bold text-slate-900">{formatPaise(subtotal)}</span>
            </div>

            {coupon && (
              <div className="flex justify-between text-red-700 font-semibold bg-red-50 p-2 rounded-lg border border-red-100">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Coupon ({coupon.code}):</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>-{formatPaise(discountAmount)}</span>
                  <button
                    onClick={removeCoupon}
                    className="text-[10px] text-slate-500 hover:text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span className={`font-bold ${isFreeShipping ? "text-emerald-700" : "text-slate-900"}`}>
                {isFreeShipping ? "FREE" : formatPaise(shippingFee)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              All prices are inclusive of GST (CGST + SGST or IGST based on shipping address).
            </p>

            <hr className="border-slate-200" />

            <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-1">
              <span>Grand Total:</span>
              <span className="text-amber-600">{formatPaise(grandTotal)}</span>
            </div>
          </div>

          {/* Coupon Input Form */}
          <div className="pt-2 border-t space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" /> Have a Coupon or Gift Code?
            </label>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WELCOME10"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg uppercase font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={couponLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </form>

            {couponError && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {couponError}
              </p>
            )}
            {couponSuccess && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {couponSuccess}
              </p>
            )}

            <div className="flex gap-2 text-[10px] text-slate-500 pt-1">
              <span>Try:</span>
              <button
                type="button"
                onClick={() => setCouponInput("WELCOME10")}
                className="font-bold text-amber-700 hover:underline"
              >
                WELCOME10
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setCouponInput("FLAT200")}
                className="font-bold text-amber-700 hover:underline"
              >
                FLAT200
              </button>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => router.push("/checkout")}
            className="w-full py-3.5 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 border border-[#fcd200]"
          >
            Proceed to Checkout ({cartCount} items) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
