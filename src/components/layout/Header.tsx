"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  MapPin,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Package,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface HeaderUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

interface HeaderProps {
  user?: HeaderUser | null;
}

const CATEGORIES = [
  { name: "All Categories", slug: "" },
  { name: "Mobiles", slug: "mobiles" },
  { name: "Electronics", slug: "electronics" },
  { name: "Fashion", slug: "fashion" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Beauty", slug: "beauty" },
  { name: "Appliances", slug: "appliances" },
  { name: "Books", slug: "books" },
  { name: "Grocery", slug: "grocery" },
  { name: "Sports", slug: "sports" },
];

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartCount } = useCart();

  const [query, setQuery] = React.useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = React.useState(
    searchParams.get("category") || ""
  );
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [pinCode, setPinCode] = React.useState("400001");
  const [pinCity, setPinCity] = React.useState("Mumbai");
  const [pinInput, setPinInput] = React.useState("");
  const [pinError, setPinError] = React.useState("");

  const [isAccountOpen, setIsAccountOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = React.useState<Array<{ id: string; name: string; slug: string; category: string }>>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Initialize PIN from localStorage if available
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("shopnest_pin");
      const savedCity = localStorage.getItem("shopnest_city");
      if (savedPin) setPinCode(savedPin);
      if (savedCity) setPinCity(savedCity);
    }
  }, []);

  // Debounced search autocomplete
  React.useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        // graceful silence
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`/catalog?${params.toString()}`);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPinError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    // Determine sample city by PIN region prefix
    let city = "India";
    const prefix = cleanPin.substring(0, 2);
    if (["40", "41", "42", "43", "44"].includes(prefix)) city = "Maharashtra";
    else if (["11"].includes(prefix)) city = "New Delhi";
    else if (["56", "57", "58", "59"].includes(prefix)) city = "Bengaluru";
    else if (["60", "61", "62", "63", "64"].includes(prefix)) city = "Chennai";
    else if (["50"].includes(prefix)) city = "Hyderabad";
    else if (["70"].includes(prefix)) city = "Kolkata";
    else if (["38", "39"].includes(prefix)) city = "Ahmedabad";

    setPinCode(cleanPin);
    setPinCity(city);
    localStorage.setItem("shopnest_pin", cleanPin);
    localStorage.setItem("shopnest_city", city);
    setIsPinModalOpen(false);
    setPinInput("");
    setPinError("");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col shadow-md">
      {/* Top Main Navigation Bar */}
      <div className="bg-[#131921] text-white px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 p-1 rounded group">
          <div className="flex flex-col items-start leading-none">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
              Shop<span className="text-amber-400">Nest</span>
              <span className="text-[10px] text-amber-400 font-bold ml-1 bg-amber-400/20 px-1 py-0.2 rounded border border-amber-400/40">.in</span>
            </span>
            <span className="text-[9px] text-slate-300 font-medium tracking-wide">AMAZON OF INDIA</span>
          </div>
        </Link>

        {/* PIN Code Delivery Selector (Desktop) */}
        <button
          onClick={() => setIsPinModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:ring-1 hover:ring-white text-left focus:outline-none transition group"
        >
          <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce duration-1000" />
          <div className="flex flex-col text-xs leading-tight">
            <span className="text-slate-300 text-[11px]">Deliver to {pinCity}</span>
            <span className="font-bold text-white text-[13px] tracking-wide">{pinCode}</span>
          </div>
        </button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-3xl mx-2">
          <form onSubmit={handleSearch} className="flex h-10 w-full rounded-md shadow-inner">
            {/* Category Dropdown */}
            <div className="relative hidden lg:block">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-full bg-slate-100 text-slate-800 text-xs font-medium px-3 rounded-l-md border-r border-slate-300 focus:outline-none cursor-pointer appearance-none pr-7"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2 top-3 pointer-events-none" />
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search ShopNest (mobiles, boAt, electronics, fashion, groceries...)"
              className="flex-1 bg-white text-slate-900 px-3 text-sm focus:outline-none placeholder:text-slate-400 rounded-l-md lg:rounded-none"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 flex items-center justify-center rounded-r-md transition font-semibold"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white text-slate-900 rounded-md shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setShowSuggestions(false);
                    router.push(`/product/${item.slug}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs sm:text-sm hover:bg-amber-50 flex items-center justify-between transition"
                >
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-normal">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-4">
          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:ring-1 hover:ring-white text-left focus:outline-none transition"
            >
              <div className="flex flex-col text-xs leading-tight">
                <span className="text-slate-300 text-[11px]">
                  {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, Sign In"}
                </span>
                <span className="font-bold text-white text-[13px] flex items-center gap-0.5">
                  Account & Lists <ChevronDown className="w-3 h-3 text-slate-300" />
                </span>
              </div>
            </button>

            {/* Account Menu Popup */}
            {isAccountOpen && (
              <div
                className="absolute right-0 top-12 w-64 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 p-3 z-50 flex flex-col gap-2"
                onMouseLeave={() => setIsAccountOpen(false)}
              >
                {user ? (
                  <>
                    <div className="border-b pb-2 px-1">
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.role === "ADMIN" && (
                        <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                          ShopNest Admin
                        </span>
                      )}
                    </div>
                    <Link
                      href="/account/orders"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm hover:bg-slate-100 rounded text-slate-700"
                    >
                      <Package className="w-4 h-4 text-amber-600" /> Your Orders
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm hover:bg-slate-100 rounded text-slate-700"
                    >
                      <Heart className="w-4 h-4 text-red-500" /> Your Wishlist
                    </Link>
                    <Link
                      href="/account/profile"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm hover:bg-slate-100 rounded text-slate-700"
                    >
                      <UserIcon className="w-4 h-4 text-slate-600" /> Profile & Addresses
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm bg-amber-50 hover:bg-amber-100 rounded font-semibold text-amber-900 border border-amber-200"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-amber-700" /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded text-left border-t mt-1 pt-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-1">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsAccountOpen(false)}
                      className="w-full text-center bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2 rounded text-xs sm:text-sm shadow-sm"
                    >
                      Sign In
                    </Link>
                    <p className="text-center text-[11px] text-slate-500">
                      New customer?{" "}
                      <Link
                        href="/auth/register"
                        onClick={() => setIsAccountOpen(false)}
                        className="text-amber-700 hover:underline font-semibold"
                      >
                        Start here.
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Returns & Orders (Desktop) */}
          <Link
            href={user ? "/account/orders" : "/auth/login"}
            className="hidden sm:flex flex-col text-xs leading-tight px-2 py-1.5 rounded hover:ring-1 hover:ring-white transition"
          >
            <span className="text-slate-300 text-[11px]">Returns</span>
            <span className="font-bold text-white text-[13px]">& Orders</span>
          </Link>

          {/* Cart Icon & Live Count */}
          <Link
            href="/cart"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:ring-1 hover:ring-white transition group relative focus:outline-none"
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-7 h-7 text-white group-hover:text-amber-400 transition" />
              <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#131921] shadow">
                {cartCount}
              </span>
            </div>
            <span className="font-bold text-white text-xs sm:text-sm hidden sm:inline-block">Cart</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-1 rounded hover:bg-slate-800 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar (Categories & Assured) */}
      <div className="bg-[#232f3e] text-white px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs sm:text-sm overflow-x-auto scrollbar-none font-medium">
        <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap">
          <Link
            href="/catalog"
            className="flex items-center gap-1 px-2 py-1 rounded hover:ring-1 hover:ring-white font-bold text-amber-300"
          >
            <Menu className="w-4 h-4" /> All Categories
          </Link>
          {CATEGORIES.slice(1, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalog?category=${cat.slug}`}
              className="hover:text-amber-300 px-1.5 py-1 transition"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/catalog?deals=true"
            className="text-amber-400 font-bold hover:underline px-1.5 py-1"
          >
            ⚡ Great Indian Deals
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-amber-300 font-semibold pl-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ShopNest Assured • 100% Genuine & GST Invoiced</span>
        </div>
      </div>

      {/* Delivery PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setIsPinModalOpen(false);
                setPinError("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Choose your location</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Delivery options, standard delivery times, and GST tax rates will be updated based on your Indian delivery PIN code.
            </p>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code (e.g. 400001)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ""));
                    setPinError("");
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {pinError && <p className="text-xs text-red-600 mt-1 font-medium">{pinError}</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-md shadow-sm"
                >
                  Apply PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#131921] border-t border-slate-700 px-4 py-4 text-white space-y-3">
          <div className="border-b border-slate-700 pb-3">
            {user ? (
              <div className="text-sm">
                <p className="font-bold">Signed in as {user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center bg-amber-400 text-slate-900 font-bold py-1.5 rounded text-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center bg-slate-700 text-white font-medium py-1.5 rounded text-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <Link
              href="/catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 hover:text-amber-400"
            >
              Browse All Products
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 hover:text-amber-400"
            >
              My Orders & Invoices
            </Link>
            <Link
              href="/account/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 hover:text-amber-400"
            >
              My Wishlist
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-1 text-amber-400 font-bold"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
