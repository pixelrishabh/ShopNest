"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  MapPin,
  Plus,
  CheckCircle2,
  Truck,
  CreditCard,
  Banknote,
  AlertCircle,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPaise } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE, STANDARD_SHIPPING_FEE_PAISE } from "@/server/services/pricing";

export interface AddressItem {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartCount, subtotal, coupon } = useCart();

  const [step, setStep] = React.useState<"address" | "payment" | "review">("address");
  const [addresses, setAddresses] = React.useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [loading, setLoading] = React.useState(false);
  const [orderError, setOrderError] = React.useState("");

  // Address form modal state
  const [isAddingAddress, setIsAddingAddress] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [addressLine2, setAddressLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("MH");
  const [postalCode, setPostalCode] = React.useState("400001");
  const [addressError, setAddressError] = React.useState("");

  const discountAmount = coupon ? coupon.discountAmount : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE;
  const shippingFee = subtotal === 0 || isFreeShipping ? 0 : STANDARD_SHIPPING_FEE_PAISE;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key";
  const isTestMode = razorpayKeyId.startsWith("rzp_test_");

  // Load addresses on mount
  React.useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses || []);
          const def = data.addresses.find((a: AddressItem) => a.isDefault) || data.addresses[0];
          if (def) setSelectedAddressId(def.id);
        } else if (res.status === 401) {
          router.push("/auth/login?callbackUrl=/checkout");
        }
      } catch {
        // ignore
      }
    }
    loadAddresses();
  }, [router]);

  // Load Razorpay script
  React.useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setAddressError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(postalCode)) {
      setAddressError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          isDefault: addresses.length === 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddressError(data.error?.message || "Failed to save address.");
        return;
      }

      setAddresses([data.address, ...addresses]);
      setSelectedAddressId(data.address.id);
      setIsAddingAddress(false);
      setFullName("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
    } catch {
      setAddressError("Network error saving address.");
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError("Please select a delivery address.");
      setStep("address");
      return;
    }

    setLoading(true);
    setOrderError("");

    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: coupon?.code || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error?.message || "Failed to create order.");
        setLoading(false);
        return;
      }

      const { order } = data;

      if (paymentMethod === "COD") {
        router.push(`/order-confirmation?orderNumber=${order.orderNumber}&status=confirmed`);
        return;
      }

      // Online payment via Razorpay
      if (!window.Razorpay) {
        setOrderError("Razorpay SDK is loading. Please try again in a few seconds.");
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: order.grandTotal,
        currency: "INR",
        name: "ShopNest Retail India",
        description: `Order ${order.orderNumber}`,
        order_id: order.razorpayOrder?.id,
        prefill: {
          name: selectedAddress?.fullName,
          contact: selectedAddress?.phone,
        },
        theme: {
          color: "#131921",
        },
        handler: async function (response: any) {
          // Verify signature on server
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              router.push(`/order-confirmation?orderNumber=${order.orderNumber}&status=paid`);
            } else {
              router.push(`/order-confirmation?orderNumber=${order.orderNumber}&status=payment_failed`);
            }
          } catch {
            router.push(`/order-confirmation?orderNumber=${order.orderNumber}&status=pending`);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setOrderError("Payment was cancelled. You can retry or choose Cash on Delivery.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse: any) {
        console.error("Payment failed:", failResponse.error);
        setOrderError(`Payment failed: ${failResponse.error?.description || "Transaction declined"}`);
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setOrderError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/catalog" className="inline-block bg-amber-400 font-bold px-5 py-2 rounded-lg text-xs">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Checkout Steps Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-500" /> Secure Checkout
        </h1>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className={step === "address" ? "text-amber-600 underline font-black" : ""}>1. Address</span>
          <span>&gt;</span>
          <span className={step === "payment" ? "text-amber-600 underline font-black" : ""}>2. Payment</span>
          <span>&gt;</span>
          <span className={step === "review" ? "text-amber-600 underline font-black" : ""}>3. Review</span>
        </div>
      </div>

      {orderError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Checkout Notice</p>
            <p>{orderError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Steps Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                Select Delivery Address
              </h2>
              {step !== "address" && (
                <button onClick={() => setStep("address")} className="text-xs font-bold text-amber-700 hover:underline">
                  Change
                </button>
              )}
            </div>

            {step === "address" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between text-xs space-y-2 ${
                        selectedAddressId === addr.id
                          ? "border-amber-500 bg-amber-50/40 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{addr.fullName}</span>
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="text-amber-500"
                          />
                        </div>
                        <p className="text-slate-600 mt-1">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p className="text-slate-500">{addr.addressLine2}</p>}
                        <p className="font-medium text-slate-800">
                          {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                        <p className="text-slate-500">Phone: {addr.phone}</p>
                      </div>
                    </label>
                  ))}

                  {/* Add New Address Card */}
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(true)}
                    className="p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-slate-50 text-slate-600 flex flex-col items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">Add a New Address</span>
                  </button>
                </div>

                {isAddingAddress && (
                  <form onSubmit={handleSaveAddress} className="p-4 bg-slate-50 rounded-xl border space-y-3">
                    <h3 className="font-bold text-xs text-slate-900">New Indian Delivery Address</h3>
                    {addressError && <p className="text-xs text-red-600 font-semibold">{addressError}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="px-3 py-2 border rounded-md bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="10-digit Mobile"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="px-3 py-2 border rounded-md bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Flat, House no., Building"
                        required
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="sm:col-span-2 px-3 py-2 border rounded-md bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Area, Street, Sector"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="sm:col-span-2 px-3 py-2 border rounded-md bg-white"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="px-3 py-2 border rounded-md bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="State (e.g. MH, DL, KA)"
                          maxLength={2}
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value.toUpperCase())}
                          className="px-3 py-2 border rounded-md bg-white uppercase font-bold"
                        />
                        <input
                          type="text"
                          placeholder="6-digit PIN"
                          maxLength={6}
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                          className="px-3 py-2 border rounded-md bg-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-900 rounded"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!selectedAddressId}
                    onClick={() => setStep("payment")}
                    className="px-6 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow transition disabled:opacity-50"
                  >
                    Use this Address &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">{selectedAddress?.fullName} ({selectedAddress?.phone})</p>
                <p>{selectedAddress?.addressLine1}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.postalCode}</p>
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                Payment Options
              </h2>
              {step === "review" && (
                <button onClick={() => setStep("payment")} className="text-xs font-bold text-amber-700 hover:underline">
                  Change
                </button>
              )}
            </div>

            {step === "payment" ? (
              <div className="space-y-4">
                <div className="space-y-3 text-xs">
                  {/* Razorpay Option */}
                  <label
                    onClick={() => setPaymentMethod("RAZORPAY")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start justify-between gap-4 ${
                      paymentMethod === "RAZORPAY"
                        ? "border-amber-500 bg-amber-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Pay Online via Razorpay (UPI, Credit/Debit Cards, NetBanking)
                          </span>
                          {isTestMode && (
                            <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded border border-amber-300">
                              TEST MODE
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 mt-1">
                          Instant confirmation. 100% secure payment gateway with instant refund guarantee.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "RAZORPAY"}
                      onChange={() => setPaymentMethod("RAZORPAY")}
                      className="text-amber-500 mt-1"
                    />
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start justify-between gap-4 ${
                      paymentMethod === "COD"
                        ? "border-amber-500 bg-amber-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Banknote className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-sm text-slate-900">Cash on Delivery (COD)</span>
                        <p className="text-slate-500 mt-1">
                          Pay cash or scan QR upon physical package delivery. Order will be marked paid once courier delivers.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="text-amber-500 mt-1"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    className="px-6 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow transition"
                  >
                    Review Order &rarr;
                  </button>
                </div>
              </div>
            ) : step === "review" ? (
              <div className="text-xs text-slate-700 flex items-center justify-between">
                <span>
                  Method: <strong className="text-slate-900">{paymentMethod === "RAZORPAY" ? "Razorpay Online (UPI/Cards)" : "Cash on Delivery (COD)"}</strong>
                </span>
                {paymentMethod === "RAZORPAY" && isTestMode && (
                  <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded border border-amber-300">
                    TEST MODE
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Step 3: Review Items & Delivery */}
          {step === "review" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                Review Items and Shipping
              </h2>

              <div className="divide-y divide-slate-100 space-y-3">
                {items.map((item) => (
                  <div key={item.variantId} className="pt-3 flex items-center gap-4 text-xs">
                    <div className="relative w-16 h-16 bg-slate-50 rounded-lg overflow-hidden border p-1 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-slate-500">Qty: {item.quantity} • Variant: {item.variantName}</p>
                      <p className="font-bold text-slate-900">{formatPaise(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="px-8 py-3.5 bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 font-black rounded-xl text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Processing Order..." : `Place Your Order (${formatPaise(grandTotal)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
          <h3 className="text-sm font-black text-slate-900 border-b pb-2">Order Details</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items ({cartCount}):</span>
              <span className="font-bold text-slate-900">{formatPaise(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-red-700 font-semibold">
                <span>Coupon ({coupon.code}):</span>
                <span>-{formatPaise(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span className="font-bold text-emerald-700">{isFreeShipping ? "FREE" : formatPaise(shippingFee)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-base font-black text-slate-900">
              <span>Order Total:</span>
              <span className="text-amber-600">{formatPaise(grandTotal)}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">ShopNest Purchase Guarantee</p>
            <p>GST input invoice included • 7 days easy returns • Free delivery over ₹499.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
