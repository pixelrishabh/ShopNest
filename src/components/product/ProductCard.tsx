"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart, ShoppingCart, Check, ShieldCheck, Eye } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { useCart } from "@/context/CartContext";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  brand: string;
  basePrice: number; // paise
  mrp: number;       // paise
  image: string;
  rating?: number;
  reviewCount?: number;
  variantId: string;
  stock?: number;
  isFeatured?: boolean;
}

export function ProductCard({
  name,
  slug,
  brand,
  basePrice,
  mrp,
  image,
  rating = 4.5,
  reviewCount = 28,
  variantId,
  stock = 15,
  isFeatured = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = React.useState(false);

  const discountPercent = mrp > basePrice ? Math.round(((mrp - basePrice) / mrp) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || stock <= 0) return;

    setAdding(true);
    const res = await addToCart(variantId, 1);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const nextState = !inWishlist;
      setInWishlist(nextState);
      await fetch("/api/wishlist", {
        method: nextState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
    } catch {
      // rollback
      setInWishlist(!inWishlist);
    }
  };

  return (
    <>
      <div className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
        {/* Top Badges & Wishlist Button */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {discountPercent >= 20 && (
              <span className="bg-[#cc0c39] text-white text-[10px] font-black px-2 py-0.5 rounded shadow tracking-wide">
                {discountPercent}% OFF
              </span>
            )}
            {isFeatured && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow">
                ★ BESTSELLER
              </span>
            )}
          </div>

          <button
            onClick={handleToggleWishlist}
            className="pointer-events-auto p-2 bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm backdrop-blur transition active:scale-90 focus:outline-none"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-4 h-4 transition ${
                inWishlist ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
        </div>

        {/* Product Image Clickable Link */}
        <Link href={`/product/${slug}`} className="block relative pt-4 px-4 bg-slate-50/50">
          <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-lg">
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2 group-hover:scale-105 transition duration-300"
            />
          </div>
        </Link>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                {brand}
              </span>
              <span className="flex items-center gap-0.5 text-emerald-700 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Assured
              </span>
            </div>

            <Link
              href={`/product/${slug}`}
              className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-amber-700 transition leading-snug"
              title={name}
            >
              {name}
            </Link>

            {/* Rating Stars */}
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 fill-slate-100"
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800 text-[11px]">{rating.toFixed(1)}</span>
              <span className="text-slate-400 text-[11px]">({reviewCount})</span>
            </div>

            {/* Price section */}
            <div className="pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900">
                  {formatPaise(basePrice)}
                </span>
                {mrp > basePrice && (
                  <span className="text-xs text-slate-400 line-through">
                    M.R.P: {formatPaise(mrp)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Inclusive of all Indian taxes (GST)</p>
            </div>

            {/* Delivery Info */}
            <div className="text-xs text-slate-600 font-medium">
              <span className="text-emerald-700 font-bold">FREE Delivery</span> Tomorrow
            </div>

            {/* Stock indicator */}
            {stock <= 5 && stock > 0 ? (
              <p className="text-[11px] text-amber-700 font-bold">Only {stock} left in stock - order soon.</p>
            ) : stock <= 0 ? (
              <p className="text-[11px] text-red-600 font-bold">Currently unavailable</p>
            ) : null}
          </div>

          {/* Action Buttons: Add to Cart + Quick View */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleAddToCart}
              disabled={adding || stock <= 0}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                added
                  ? "bg-emerald-600 text-white"
                  : stock <= 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 border border-[#fcd200]"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart
                </>
              ) : adding ? (
                "Adding..."
              ) : stock <= 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>

            <button
              onClick={() => setIsQuickViewOpen(true)}
              className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition"
              title="Quick View"
              aria-label="Quick View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 relative shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="relative w-full h-56 bg-slate-50 rounded-xl overflow-hidden p-2">
                <Image src={image} alt={name} fill className="object-contain" />
              </div>
              <div className="space-y-3">
                <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">
                  {brand}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{name}</h3>
                <div className="text-lg font-black text-slate-900">
                  {formatPaise(basePrice)}
                  {mrp > basePrice && (
                    <span className="text-xs text-slate-400 line-through ml-2 font-normal">
                      {formatPaise(mrp)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-700 font-semibold">
                  ✓ Assured GST Invoice • 7 Days Replacement Policy
                </p>
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/product/${slug}`}
                    className="flex-1 text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs"
                  >
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
