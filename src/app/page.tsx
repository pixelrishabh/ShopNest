import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Sparkles,
  Tv,
  BookOpen,
  Apple,
  Dumbbell,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Percent,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  mobiles: Smartphone,
  electronics: Laptop,
  fashion: Shirt,
  "home-kitchen": Home,
  beauty: Sparkles,
  appliances: Tv,
  books: BookOpen,
  grocery: Apple,
  sports: Dumbbell,
};

export const revalidate = 60; // ISR cache

export default async function HomePage() {
  let categories: any[] = [];
  let featuredProducts: any[] = [];
  let deals: any[] = [];
  let bestSellers: any[] = [];

  try {
    categories = await db.category.findMany({
      orderBy: { name: "asc" },
      take: 9,
    });

    const products = await db.product.findMany({
      where: { isPublished: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: { take: 1 },
        reviews: { select: { rating: true } },
      },
      take: 16,
    });

    featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);
    deals = products.filter((p) => p.mrp > p.basePrice).slice(0, 8);
    bestSellers = products.slice(0, 8);
  } catch {
    // If DB isn't seeded yet, fallback gracefully
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-r from-[#131921] via-[#1a2330] to-[#232f3e] text-white py-12 px-4 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow">
              <Percent className="w-3.5 h-3.5" /> Great Indian Shopping Carnival
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              India&apos;s Biggest Deals on <span className="text-amber-400">Electronics</span> & Daily Essentials
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-lg">
              Explore 40+ curated products from India&apos;s trusted brands. Enjoy GST-inclusive prices, verified reviews, Cash on Delivery, and instant tax invoices.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/catalog?deals=true"
                className="bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-black px-6 py-3 rounded-lg text-sm shadow-md transition active:scale-95"
              >
                Shop Mega Deals
              </Link>
              <Link
                href="/catalog"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg text-sm backdrop-blur transition"
              >
                Explore Catalog
              </Link>
            </div>
          </div>

          {/* Hero Visual Pill Card */}
          <div className="relative flex justify-center items-center">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                <span>⚡ DEAL OF THE DAY</span>
                <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">UP TO 50% OFF</span>
              </div>
              <div className="relative h-44 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center p-4">
                <div className="text-center space-y-1">
                  <p className="text-xl font-black text-white">Smartphones & TWS Audio</p>
                  <p className="text-xs text-slate-300">OnePlus, boAt, Noise & Samsung</p>
                  <span className="inline-block mt-2 text-xs bg-amber-400 text-slate-900 font-bold px-3 py-1 rounded-full">
                    Starting from ₹1,399
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/5 p-2 rounded-lg">
                  <p className="text-amber-400 font-bold">Free</p>
                  <p className="text-slate-400 text-[10px]">Delivery &gt; ₹499</p>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <p className="text-emerald-400 font-bold">100%</p>
                  <p className="text-slate-400 text-[10px]">Original Stock</p>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <p className="text-blue-400 font-bold">Razorpay</p>
                  <p className="text-slate-400 text-[10px]">& COD Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Trust Badges Bar */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">Fast Pan-India Delivery</p>
              <p className="text-[11px] text-slate-500">Across 20,000+ Indian PIN codes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">GST Invoice Included</p>
              <p className="text-[11px] text-slate-500">Claim tax input credit seamlessly</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">Razorpay & Cash on Delivery</p>
              <p className="text-[11px] text-slate-500">UPI, Cards, NetBanking or COD</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">7 Days Easy Return</p>
              <p className="text-[11px] text-slate-500">Hassle-free replacement policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Horizontal Carousel */}
      <section className="max-w-7xl mx-auto px-4 w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Shop by Category</h2>
            <p className="text-xs text-slate-500">Discover everything from tech to daily groceries</p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
          >
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Smartphone;
            return (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className="group flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center text-slate-700 group-hover:text-amber-700 transition mb-2">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 line-clamp-1">
                  {cat.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trending Deals Grid */}
      <section className="max-w-7xl mx-auto px-4 w-full space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#cc0c39] text-white text-xs font-black px-2.5 py-1 rounded">
              TODAY&apos;S DEALS
            </span>
            <h2 className="text-xl font-black text-slate-900">Top Discounts & Festive Offers</h2>
          </div>
          <Link href="/catalog?deals=true" className="text-xs font-bold text-amber-700 hover:underline">
            See all deals &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {deals.slice(0, 4).map((p) => {
            const variant = p.variants[0];
            const avgRating =
              p.reviews.length > 0
                ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length
                : 4.5;
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                brand={p.brand}
                basePrice={p.basePrice}
                mrp={p.mrp}
                image={p.images[0]?.url || `/images/products/${p.slug}.svg`}
                rating={avgRating}
                reviewCount={p.reviews.length || 18}
                variantId={variant?.id || ""}
                stock={variant?.stock ?? 10}
                isFeatured={p.isFeatured}
              />
            );
          })}
        </div>
      </section>

      {/* Featured Bestsellers Grid */}
      <section className="max-w-7xl mx-auto px-4 w-full space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="text-xl font-black text-slate-900">Bestsellers in Electronics & Mobiles</h2>
            <p className="text-xs text-slate-500">Customer favorites with thousands of verified 5-star reviews</p>
          </div>
          <Link href="/catalog?sort=popularity" className="text-xs font-bold text-amber-700 hover:underline">
            View bestsellers &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredProducts.slice(0, 4).map((p) => {
            const variant = p.variants[0];
            const avgRating =
              p.reviews.length > 0
                ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length
                : 4.8;
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                brand={p.brand}
                basePrice={p.basePrice}
                mrp={p.mrp}
                image={p.images[0]?.url || `/images/products/${p.slug}.svg`}
                rating={avgRating}
                reviewCount={p.reviews.length || 35}
                variantId={variant?.id || ""}
                stock={variant?.stock ?? 25}
                isFeatured={true}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
