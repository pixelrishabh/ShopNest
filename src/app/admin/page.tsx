import Link from "next/link";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. Revenue from paid orders ONLY
  const paidOrders = await db.order.findMany({
    where: {
      OR: [
        { paymentStatus: PaymentStatus.CAPTURED },
        { status: OrderStatus.DELIVERED },
      ],
    },
    select: { grandTotal: true },
  });

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // 2. Platform Metrics
  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    paymentFailures,
    lowStockVariants,
    returnRequests,
  ] = await Promise.all([
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { isPublished: true } }),
    db.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
    db.order.count({ where: { status: OrderStatus.PAYMENT_FAILED } }),
    db.productVariant.count({ where: { stock: { lte: 5 } } }),
    db.returnRequest.count({ where: { status: "REQUESTED" } }),
  ]);

  // 3. Recent Orders
  const recentOrders = await db.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin KPI Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Indian e-commerce metrics, inventory health, and order fulfillment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card (Paid orders only) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Verified Paid Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatPaise(totalRevenue)}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Excludes unpaid and pending orders</p>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Orders Placed</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalOrders}</p>
          <p className="text-[11px] text-slate-500">{pendingOrders} pending confirmation</p>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Low Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{lowStockVariants}</p>
          <p className="text-[11px] text-amber-800 font-medium">Variants with &le; 5 units left</p>
        </div>

        {/* Customers Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Customers</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCustomers}</p>
          <p className="text-[11px] text-slate-500">{totalProducts} published products</p>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Pending Payments:</span>
            <span className="font-bold text-slate-900 ml-2">{pendingOrders}</span>
          </div>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Payment Failures:</span>
            <span className="font-bold text-red-600 ml-2">{paymentFailures}</span>
          </div>
          <XCircle className="w-4 h-4 text-red-500" />
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Return Requests:</span>
            <span className="font-bold text-purple-600 ml-2">{returnRequests}</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-purple-500" />
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-base font-black text-slate-900">Recent Customer Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-amber-700 hover:underline">
            Manage All Orders &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{ord.user?.name || "Customer"}</p>
                    <p className="text-[10px] text-slate-400">{ord.user?.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{ord.paymentMethod}</span>
                    <span className="text-[10px] block text-slate-400">{ord.paymentStatus}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatPaise(ord.grandTotal)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <a
                      href={`/api/orders/${ord.id}/invoice`}
                      className="text-blue-600 hover:underline font-semibold"
                      title="Invoice"
                    >
                      PDF
                    </a>
                    <Link
                      href="/admin/orders"
                      className="text-amber-700 hover:underline font-semibold"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
