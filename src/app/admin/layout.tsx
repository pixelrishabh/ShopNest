import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?callbackUrl=/admin");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#131921] text-white p-5 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <Link href="/admin" className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
              Shop<span className="text-amber-400">Nest</span>
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">
                Admin
              </span>
            </Link>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" /> Dashboard Overview
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <Package className="w-4 h-4 text-blue-400" /> Orders & Shipping
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" /> Products & Inventory
            </Link>

            <Link
              href="/admin/customers"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <Users className="w-4 h-4 text-purple-400" /> Customers & Moderation
            </Link>

            <Link
              href="/admin/coupons"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <Tag className="w-4 h-4 text-amber-400" /> Coupons & Discounts
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Customer Store
          </Link>
        </div>
      </aside>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
