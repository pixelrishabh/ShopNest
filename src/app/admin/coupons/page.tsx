"use client";

import * as React from "react";
import { Tag, Plus, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { formatPaise } from "@/lib/money";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [value, setValue] = React.useState(10);
  const [minOrder, setMinOrder] = React.useState(500);
  const [maxDiscount, setMaxDiscount] = React.useState(300);
  const [usageLimit, setUsageLimit] = React.useState(500);
  const [validDays, setValidDays] = React.useState(30);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const fetchCoupons = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: type === "PERCENTAGE" ? value : value * 100, // convert ₹ to paise for flat
          minOrderAmount: minOrder * 100,
          maxDiscount: type === "PERCENTAGE" ? maxDiscount * 100 : null,
          usageLimit,
          validDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to create coupon.");
      } else {
        setSuccess(`Coupon ${code} created successfully!`);
        setIsModalOpen(false);
        setCode("");
        await fetchCoupons();
      }
    } catch {
      setError("Network error creating coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Coupons & Promotional Offers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage percentage and flat discounts, validity periods, and user redemption limits
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount Type</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Min Order Amount</th>
                <th className="py-3 px-4">Max Cap</th>
                <th className="py-3 px-4">Times Redeemed</th>
                <th className="py-3 px-4">Status & Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading coupons...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No coupons created yet.</td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = new Date(c.validUntil) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-black text-slate-900 tracking-wide">{c.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{c.type}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.type === "PERCENTAGE" ? `${c.value}% OFF` : `${formatPaise(c.value)} OFF`}
                      </td>
                      <td className="py-3 px-4">{formatPaise(c.minOrderAmount)}</td>
                      <td className="py-3 px-4">{c.maxDiscount ? formatPaise(c.maxDiscount) : "No Cap"}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{c.timesUsed}</td>
                      <td className="py-3 px-4">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            Expired ({new Date(c.validUntil).toLocaleDateString("en-IN")})
                          </span>
                        ) : c.isActive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active (until {new Date(c.validUntil).toLocaleDateString("en-IN")})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Create New Coupon</h3>
            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-md uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-semibold"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">
                    {type === "PERCENTAGE" ? "Discount %" : "Discount in ₹"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border rounded-md font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Min. Order Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {type === "PERCENTAGE" && (
                  <div>
                    <label className="font-bold text-slate-700">Max Cap (₹)</label>
                    <input
                      type="number"
                      min={10}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700">Validity in Days</label>
                <input
                  type="number"
                  min={1}
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded shadow"
                >
                  {submitting ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
