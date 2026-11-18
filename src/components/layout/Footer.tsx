"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
      }
    } catch {
      // fallback success in demo
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mt-auto bg-[#232f3e] text-white">
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="w-full py-3.5 bg-[#37475a] hover:bg-[#485769] text-center text-xs sm:text-sm font-semibold transition"
      >
        Back to top
      </button>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs sm:text-sm">
        <div>
          <h4 className="font-bold text-white mb-3 text-sm">Get to Know Us</h4>
          <ul className="space-y-2 text-slate-300">
            <li><Link href="/" className="hover:underline">About ShopNest</Link></li>
            <li><Link href="/" className="hover:underline">Careers</Link></li>
            <li><Link href="/" className="hover:underline">Press Releases</Link></li>
            <li><Link href="/" className="hover:underline">ShopNest Science</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3 text-sm">Connect with Us</h4>
          <ul className="space-y-2 text-slate-300">
            <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:underline">Facebook</a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:underline">Twitter / X</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:underline">Instagram</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3 text-sm">Make Money with Us</h4>
          <ul className="space-y-2 text-slate-300">
            <li><Link href="/catalog" className="hover:underline">Sell on ShopNest</Link></li>
            <li><Link href="/" className="hover:underline">Supply to ShopNest</Link></li>
            <li><Link href="/" className="hover:underline">Become an Affiliate</Link></li>
            <li><Link href="/" className="hover:underline">Fulfilment by ShopNest</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3 text-sm">Let Us Help You</h4>
          <ul className="space-y-2 text-slate-300">
            <li><Link href="/account/profile" className="hover:underline">Your Account</Link></li>
            <li><Link href="/account/orders" className="hover:underline">Returns Centre</Link></li>
            <li><Link href="/" className="hover:underline">100% Purchase Protection</Link></li>
            <li><Link href="/" className="hover:underline">Help & Support</Link></li>
          </ul>
        </div>
      </div>

      {/* Newsletter Subscription Strip */}
      <div className="border-t border-slate-700 bg-[#131921] py-8 px-4 sm:px-8">
        <div className="max-w-xl mx-auto text-center space-y-3">
          <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" /> Subscribe to Indian Festive Deals
          </h4>
          <p className="text-xs text-slate-400">
            Get exclusive coupon codes, early access to Great Indian Deals, and low-price drops straight in your inbox.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-950/40 py-2.5 px-4 rounded-md border border-emerald-800">
              <CheckCircle2 className="w-5 h-5" /> Thank you for subscribing to ShopNest India!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-900 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 text-xs sm:text-sm rounded-md transition disabled:opacity-50"
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Legal & GST Notice */}
      <div className="border-t border-slate-800 bg-[#0d1217] py-6 px-4 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-4 text-slate-300 font-medium">
          <span>India</span>
          <span>•</span>
          <span>English</span>
          <span>•</span>
          <span>INR (₹)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Conditions of Use & Sale • Privacy Notice • Interest-Based Ads • GST Policy
        </p>
        <p className="text-[10px] text-slate-400">
          © 2026 ShopNest Retail Private Limited. GSTIN: {process.env.NEXT_PUBLIC_SELLER_GSTIN || "27AAACS1234A1Z5"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
