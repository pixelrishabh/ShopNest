import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopNest: Online Shopping India - Mobiles, Electronics, Fashion & More",
  description:
    "India's premier online marketplace. Shop mobiles, laptops, electronics, Indian groceries, fashion, and home appliances with fast delivery and GST invoices.",
  keywords: [
    "ShopNest",
    "online shopping India",
    "mobiles",
    "electronics",
    "GST invoice",
    "Cash on Delivery",
    "Razorpay",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950">
        <Providers>
          <Header user={user} />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
