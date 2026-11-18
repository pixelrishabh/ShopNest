import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { Filter, X, ChevronRight, SlidersHorizontal } from "lucide-react";

interface CatalogPageProps {
  searchParams: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
    sort?: string;
    page?: string;
    deals?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const query = searchParams.q?.trim() || "";
  const categorySlug = searchParams.category?.trim() || "";
  const selectedBrand = searchParams.brand?.trim() || "";
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice, 10) * 100 : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) * 100 : undefined;
  const minRating = searchParams.rating ? parseFloat(searchParams.rating) : undefined;
  const inStockOnly = searchParams.inStock === "true";
  const dealsOnly = searchParams.deals === "true";
  const sort = searchParams.sort || "newest";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 12;

  // Build Prisma Where Clause
  const where: any = {
    isPublished: true,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { brand: { contains: query, mode: "insensitive" } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (selectedBrand) {
    where.brand = selectedBrand;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {};
    if (minPrice !== undefined) where.basePrice.gte = minPrice;
    if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
  }

  if (inStockOnly) {
    where.variants = {
      some: { stock: { gt: 0 } },
    };
  }

  // Sorting
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { basePrice: "asc" };
  else if (sort === "price_desc") orderBy = { basePrice: "desc" };
  else if (sort === "rating") orderBy = { reviews: { _count: "desc" } };
  else if (sort === "popularity") orderBy = { isFeatured: "desc" };

  let products: any[] = [];
  let totalProducts = 0;
  let categories: any[] = [];
  let availableBrands: string[] = [];

  try {
    categories = await db.category.findMany({ orderBy: { name: "asc" } });

    // Distinct brands for filter sidebar
    const allProds = await db.product.findMany({
      where: { isPublished: true },
      select: { brand: true },
      distinct: ["brand"],
    });
    availableBrands = allProds.map((p) => p.brand).sort();

    [products, totalProducts] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: true,
          reviews: { select: { rating: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where }),
    ]);
  } catch (err) {
    console.error("Catalog query error:", err);
  }

  // In-memory filter for deals if requested
  if (dealsOnly) {
    products = products.filter((p) => p.mrp > p.basePrice);
  }

  // Filter by minRating if requested
  if (minRating) {
    products = products.filter((p) => {
      const avg =
        p.reviews.length > 0
          ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length
          : 0;
      return avg >= minRating;
    });
  }

  const totalPages = Math.ceil(totalProducts / pageSize);

  // Helper to build URL with preserved params
  const createFilterUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categorySlug) params.set("category", categorySlug);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
    if (searchParams.rating) params.set("rating", searchParams.rating);
    if (inStockOnly) params.set("inStock", "true");
    if (dealsOnly) params.set("deals", "true");
    if (sort) params.set("sort", sort);

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null) params.delete(key);
      else params.set(key, val);
    });

    return `/catalog?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/catalog" className="hover:text-amber-700">Catalog</Link>
        {categorySlug && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-800 capitalize">
              {categories.find((c) => c.slug === categorySlug)?.name || categorySlug}
            </span>
          </>
        )}
      </nav>

      {/* Header and Results Count Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {query ? `Results for "${query}"` : categorySlug ? categories.find((c) => c.slug === categorySlug)?.name : "All Products"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {products.length} of {totalProducts} products across India
          </p>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <label htmlFor="sort-select" className="text-slate-600 font-medium">Sort by:</label>
          <form method="GET" action="/catalog">
            {query && <input type="hidden" name="q" value={query} />}
            {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
            {selectedBrand && <input type="hidden" name="brand" value={selectedBrand} />}
            <select
              id="sort-select"
              name="sort"
              defaultValue={sort}
              // @ts-ignore
              onChange="this.form.submit()"
              className="bg-white border border-slate-300 text-slate-800 rounded-md px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Featured: Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popularity">Avg. Customer Review / Popularity</option>
            </select>
          </form>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products List */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <aside className="space-y-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" /> Filter Results
            </h3>
            <Link href="/catalog" className="text-[11px] text-amber-700 hover:underline font-semibold">
              Reset All
            </Link>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Department</h4>
            <div className="space-y-1">
              <Link
                href={createFilterUrl({ category: null, page: "1" })}
                className={`block py-1 hover:text-amber-700 ${!categorySlug ? "font-bold text-amber-700" : "text-slate-600"}`}
              >
                All Departments
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={createFilterUrl({ category: c.slug, page: "1" })}
                  className={`block py-1 hover:text-amber-700 ${categorySlug === c.slug ? "font-bold text-amber-700" : "text-slate-600"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Brand</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {availableBrands.map((b) => (
                <Link
                  key={b}
                  href={createFilterUrl({ brand: selectedBrand === b ? null : b, page: "1" })}
                  className={`flex items-center justify-between py-1 hover:text-amber-700 ${selectedBrand === b ? "font-bold text-amber-700" : "text-slate-600"}`}
                >
                  <span>{b}</span>
                  {selectedBrand === b && <X className="w-3.5 h-3.5 text-amber-700" />}
                </Link>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Price</h4>
            <div className="space-y-1">
              <Link href={createFilterUrl({ minPrice: null, maxPrice: "1000", page: "1" })} className="block py-1 hover:text-amber-700 text-slate-600">
                Under ₹1,000
              </Link>
              <Link href={createFilterUrl({ minPrice: "1000", maxPrice: "5000", page: "1" })} className="block py-1 hover:text-amber-700 text-slate-600">
                ₹1,000 - ₹5,000
              </Link>
              <Link href={createFilterUrl({ minPrice: "5000", maxPrice: "20000", page: "1" })} className="block py-1 hover:text-amber-700 text-slate-600">
                ₹5,000 - ₹20,000
              </Link>
              <Link href={createFilterUrl({ minPrice: "20000", maxPrice: null, page: "1" })} className="block py-1 hover:text-amber-700 text-slate-600">
                Over ₹20,000
              </Link>
            </div>
          </div>

          {/* Customer Reviews Filter */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Avg. Customer Review</h4>
            <div className="space-y-1">
              {[4, 3, 2].map((stars) => (
                <Link
                  key={stars}
                  href={createFilterUrl({ rating: stars.toString(), page: "1" })}
                  className="flex items-center gap-1.5 py-1 hover:text-amber-700 text-slate-600"
                >
                  <span className="text-amber-500 font-bold">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
                  <span>& Up</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Availability</h4>
            <Link
              href={createFilterUrl({ inStock: inStockOnly ? null : "true", page: "1" })}
              className={`flex items-center gap-2 py-1 ${inStockOnly ? "font-bold text-emerald-700" : "text-slate-600"}`}
            >
              <input type="checkbox" checked={inStockOnly} readOnly className="rounded text-amber-500 focus:ring-amber-400" />
              <span>Include Out of Stock</span>
            </Link>
          </div>
        </aside>

        {/* Right Products Grid */}
        <main className="md:col-span-3 space-y-6">
          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <h3 className="text-lg font-bold text-slate-900">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search query, clearing filters, or browsing other categories.
              </p>
              <Link
                href="/catalog"
                className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => {
                const variant = p.variants[0];
                const avgRating =
                  p.reviews.length > 0
                    ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length
                    : 4.6;
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
                    reviewCount={p.reviews.length || 24}
                    variantId={variant?.id || ""}
                    stock={variant?.stock ?? 10}
                    isFeatured={p.isFeatured}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t">
              {page > 1 && (
                <Link
                  href={createFilterUrl({ page: (page - 1).toString() })}
                  className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-slate-100"
                >
                  Previous
                </Link>
              )}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pNum = i + 1;
                return (
                  <Link
                    key={pNum}
                    href={createFilterUrl({ page: pNum.toString() })}
                    className={`w-9 h-9 flex items-center justify-center rounded-md text-xs font-bold ${
                      pNum === page
                        ? "bg-amber-400 text-slate-950 border border-amber-500 shadow-sm"
                        : "border border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {pNum}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link
                  href={createFilterUrl({ page: (page + 1).toString() })}
                  className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-slate-100"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
