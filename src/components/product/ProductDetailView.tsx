"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingCart,
  Zap,
  MapPin,
  Heart,
  ChevronRight,
  Info,
} from "lucide-react";
import { formatPaise } from "@/lib/money";
import { useCart } from "@/context/CartContext";

export interface VariantData {
  id: string;
  sku: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  attributes?: any;
}

export interface ReviewData {
  id: string;
  rating: number;
  title: string;
  comment: string;
  user: { name: string };
  createdAt: Date | string;
  isVerifiedPurchase: boolean;
}

export interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    description: string;
    basePrice: number;
    mrp: number;
    gstRate: number;
    category: { name: string; slug: string };
    images: Array<{ id: string; url: string; altText: string }>;
    variants: VariantData[];
    reviews: ReviewData[];
  };
  relatedProducts: any[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailProps) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = React.useState<VariantData>(
    product.variants[0] || {
      id: "",
      sku: "DEFAULT",
      name: "Standard",
      price: product.basePrice,
      mrp: product.mrp,
      stock: 10,
    }
  );

  const [quantity, setQuantity] = React.useState(1);
  const [selectedImage, setSelectedImage] = React.useState(
    product.images[0]?.url || `/images/products/${product.slug}.svg`
  );
  const [pinCode, setPinCode] = React.useState("400001");
  const [pinCity, setPinCity] = React.useState("Mumbai");
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);

  // Review form state
  const [ratingInput, setRatingInput] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState("");
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [reviewSuccess, setReviewSuccess] = React.useState(false);
  const [localReviews, setLocalReviews] = React.useState(product.reviews);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("shopnest_pin");
      const savedCity = localStorage.getItem("shopnest_city");
      if (savedPin) setPinCode(savedPin);
      if (savedCity) setPinCity(savedCity);
    }
  }, []);

  const currentPrice = selectedVariant.price;
  const currentMrp = selectedVariant.mrp;
  const discountPercent = currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const avgRating =
    localReviews.length > 0
      ? localReviews.reduce((acc, r) => acc + r.rating, 0) / localReviews.length
      : 4.5;

  const handleAddToCart = async () => {
    if (selectedVariant.stock <= 0 || adding) return;
    setAdding(true);
    const res = await addToCart(selectedVariant.id, quantity);
    setAdding(false);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const nextState = !inWishlist;
      setInWishlist(nextState);
      await fetch("/api/wishlist", {
        method: nextState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id }),
      });
    } catch {
      setInWishlist(!inWishlist);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingInput,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewSuccess(true);
        setLocalReviews([data.review, ...localReviews]);
        setReviewTitle("");
        setReviewComment("");
      }
    } catch {
      // ignore
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-amber-700">
          {product.category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800 line-clamp-1">{product.name}</span>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery & Zoom Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative w-full h-80 sm:h-96 md:h-[450px] bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex items-center justify-center group">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-4 group-hover:scale-110 transition duration-300"
              priority
            />
            <div className="absolute top-4 left-4 bg-[#cc0c39] text-white text-xs font-black px-2.5 py-1 rounded shadow">
              {discountPercent}% OFF
            </div>
            <button
              onClick={handleToggleWishlist}
              className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 rounded-full shadow border transition"
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative w-16 h-16 rounded-lg border-2 p-1 bg-white flex-shrink-0 transition ${
                    selectedImage === img.url ? "border-amber-500 shadow" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Image src={img.url} alt={img.altText} fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Product Information & Specs (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="space-y-1">
            <Link
              href={`/catalog?brand=${encodeURIComponent(product.brand)}`}
              className="text-xs font-bold text-amber-700 uppercase tracking-wider hover:underline"
            >
              Brand: {product.brand}
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(avgRating) ? "fill-amber-400" : "text-slate-300"}`}
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800">{avgRating.toFixed(1)}</span>
              <span className="text-slate-400">|</span>
              <a href="#reviews" className="text-blue-600 hover:underline">
                {localReviews.length} verified ratings
              </a>
              <span className="text-slate-400">|</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Prime Assured
              </span>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Price & GST breakdown */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-950">
                {formatPaise(currentPrice)}
              </span>
              {currentMrp > currentPrice && (
                <span className="text-sm text-slate-400 line-through">
                  M.R.P.: {formatPaise(currentMrp)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              Inclusive of all taxes ({product.gstRate}% GST included in price)
            </p>
          </div>

          {/* Variant Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Select Option / Variant:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 text-left rounded-xl border text-xs transition ${
                      selectedVariant.id === v.id
                        ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className="font-bold text-slate-900">{v.name}</p>
                    <p className="text-slate-600 mt-0.5">{formatPaise(v.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Key Product Features / Specs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">About this item</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Indian Buyer Guarantees Grid */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600" />
              <p className="font-bold text-slate-800 text-[11px]">100% Genuine</p>
              <p className="text-[10px] text-slate-500">Direct Brand Stock</p>
            </div>
            <div className="space-y-1">
              <RotateCcw className="w-5 h-5 mx-auto text-blue-600" />
              <p className="font-bold text-slate-800 text-[11px]">7 Days Return</p>
              <p className="text-[10px] text-slate-500">Replacement Guarantee</p>
            </div>
            <div className="space-y-1">
              <Truck className="w-5 h-5 mx-auto text-amber-600" />
              <p className="font-bold text-slate-800 text-[11px]">Free Delivery</p>
              <p className="text-[10px] text-slate-500">Orders above ₹499</p>
            </div>
          </div>
        </div>

        {/* Right: Buy Box / Checkout Actions (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <span className="text-2xl font-black text-slate-950">{formatPaise(currentPrice)}</span>
            <p className="text-xs text-emerald-700 font-bold">
              FREE delivery <span className="text-slate-900">Tomorrow</span>
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-600 pt-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Deliver to {pinCity} - {pinCode}</span>
            </div>
          </div>

          {/* Stock Availability */}
          <div>
            {selectedVariant.stock > 5 ? (
              <span className="text-sm font-bold text-emerald-700">In Stock</span>
            ) : selectedVariant.stock > 0 ? (
              <span className="text-sm font-bold text-amber-700">
                Only {selectedVariant.stock} left in stock - order soon
              </span>
            ) : (
              <span className="text-sm font-bold text-red-600">Currently Out of Stock</span>
            )}
          </div>

          {/* Quantity Selector */}
          {selectedVariant.stock > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <label htmlFor="quantity-select" className="font-bold text-slate-700">Quantity:</label>
              <select
                id="quantity-select"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Array.from({ length: Math.min(10, selectedVariant.stock) }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={adding || selectedVariant.stock <= 0}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition active:scale-95 ${
                added
                  ? "bg-emerald-600 text-white"
                  : selectedVariant.stock <= 0
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
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>

            <Link
              href="/checkout"
              onClick={handleAddToCart}
              className="w-full py-3 px-4 rounded-xl text-xs font-black bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 flex items-center justify-center gap-2 shadow-md transition active:scale-95"
            >
              <Zap className="w-4 h-4" /> Buy Now
            </Link>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="font-semibold text-slate-700">Razorpay / COD</span>
            </div>
            <div className="flex justify-between">
              <span>Dispatched from:</span>
              <span className="font-semibold text-slate-700">ShopNest Fulfilment</span>
            </div>
            <div className="flex justify-between">
              <span>Sold by:</span>
              <span className="font-semibold text-slate-700">{product.brand} Official</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <section id="reviews" className="border-t pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Customer Reviews & Ratings</h2>
            <p className="text-xs text-slate-500">Verified purchases from real buyers in India</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">{avgRating.toFixed(1)}</span>
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(avgRating) ? "fill-amber-400" : "text-slate-200"}`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">based on {localReviews.length} reviews</span>
          </div>
        </div>

        {/* Add Review Form */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Write a Customer Review</h3>
          {reviewSuccess ? (
            <div className="text-xs text-emerald-700 font-bold bg-emerald-100 p-3 rounded-lg border border-emerald-300">
              ✓ Thank you! Your review has been published.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-slate-700">Your Rating:</span>
                <select
                  value={ratingInput}
                  onChange={(e) => setRatingInput(parseInt(e.target.value, 10))}
                  className="bg-white border rounded px-2 py-1 text-xs font-bold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                  <option value={3}>⭐⭐⭐ (3 - Average)</option>
                  <option value={2}>⭐⭐ (2 - Poor)</option>
                  <option value={1}>⭐ (1 - Terrible)</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Headline / Title (e.g. Best battery life in this budget)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <textarea
                  placeholder="Write your review here... (genuine feedback helps other Indian buyers)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-5 py-2 rounded-md text-xs transition"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4 divide-y divide-slate-100">
          {localReviews.map((rev) => (
            <div key={rev.id} className="pt-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{rev.user?.name || "Customer"}</span>
                {rev.isVerifiedPurchase && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    Verified Purchase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-slate-800">{rev.title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t pt-8 space-y-4">
          <h2 className="text-xl font-black text-slate-900">Similar Products You Might Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((rp) => (
              <Link
                key={rp.id}
                href={`/product/${rp.slug}`}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative w-full h-36 mb-2">
                  <Image
                    src={rp.images[0]?.url || `/images/products/${rp.slug}.svg`}
                    alt={rp.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <p className="font-bold text-xs text-slate-900 line-clamp-1">{rp.name}</p>
                <p className="text-sm font-black text-slate-900 mt-1">{formatPaise(rp.basePrice)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
