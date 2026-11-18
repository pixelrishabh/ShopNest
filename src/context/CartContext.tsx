"use client";

import * as React from "react";

export interface CartItemModel {
  id: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number; // paise
  mrp: number;   // paise
  gstRate: number;
  stock: number;
  image: string;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  discountAmount: number;
}

interface CartContextType {
  items: CartItemModel[];
  cartCount: number;
  subtotal: number;
  coupon: AppliedCoupon | null;
  loading: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (variantId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItemModel[]>([]);
  const [coupon, setCoupon] = React.useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshCart = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.coupon) {
          setCoupon(data.coupon);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const cartCount = React.useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const subtotal = React.useMemo(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const addToCart = async (variantId: string, quantity = 1) => {
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error?.message || "Failed to add to cart" };
      }

      await refreshCart();
      return { success: true, message: "Added to cart" };
    } catch {
      return { success: false, message: "Network error adding item" };
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/items/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error?.message || "Failed to update quantity" };
      }

      await refreshCart();
      return { success: true };
    } catch {
      return { success: false, message: "Network error updating quantity" };
    }
  };

  const removeItem = async (variantId: string) => {
    try {
      await fetch(`/api/cart/items/${variantId}`, { method: "DELETE" });
      await refreshCart();
    } catch {
      // ignore
    }
  };

  const clearCart = async () => {
    try {
      await fetch("/api/cart", { method: "DELETE" });
      setItems([]);
      setCoupon(null);
    } catch {
      // ignore
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error?.message || "Invalid coupon" };
      }

      setCoupon(data.coupon);
      return { success: true, message: `Coupon ${code} applied successfully!` };
    } catch {
      return { success: false, message: "Error validating coupon" };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        coupon,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
