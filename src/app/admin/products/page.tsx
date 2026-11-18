import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { Plus, AlertTriangle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: {
      category: true,
      variants: true,
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Product & Inventory Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all 40+ products, stock levels, GST tax slabs, and variants
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">GST Rate</th>
                <th className="py-3 px-4">Variants & Stock</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const hasLowStock = p.variants.some((v) => v.stock <= 5);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-slate-50 rounded-lg overflow-hidden border p-1 flex-shrink-0">
                          <Image
                            src={p.images[0]?.url || `/images/products/${p.slug}.svg`}
                            alt={p.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-slate-400">Slug: {p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{p.category.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.brand}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatPaise(p.basePrice)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700 text-[10px]">
                        {p.gstRate}% GST
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {p.variants.map((v) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <span className="text-slate-800 font-medium">{v.name}:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                v.stock <= 5
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {v.stock} in stock
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/product/${p.slug}`}
                        className="text-amber-700 hover:underline font-bold text-xs"
                      >
                        Store &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
