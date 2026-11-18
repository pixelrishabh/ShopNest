import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import crypto from "crypto";

const GUEST_CART_COOKIE = "shopnest_guest_cart";

const addItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { variantId, quantity } = parsed.data;

    // Verify variant exists and product is active
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.product.isPublished) {
      return jsonError("PRODUCT_NOT_FOUND", "The requested product variant is not available.", 404);
    }

    if (variant.stock <= 0) {
      return jsonError("OUT_OF_STOCK", "This product is currently out of stock.", 400);
    }

    // Determine User or Guest Cart
    const user = await getCurrentUser();
    let cartId: string;
    let guestId: string | null = null;

    if (user) {
      let cart = await db.cart.findUnique({ where: { userId: user.id } });
      if (!cart) {
        cart = await db.cart.create({ data: { userId: user.id } });
      }
      cartId = cart.id;
    } else {
      guestId = req.cookies.get(GUEST_CART_COOKIE)?.value || null;
      let cart: any = null;
      if (guestId) {
        cart = await db.cart.findUnique({ where: { guestId } });
      }
      if (!cart) {
        guestId = crypto.randomUUID();
        cart = await db.cart.create({ data: { guestId } });
      }
      cartId = cart.id;
    }

    // Check existing quantity in cart
    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId, variantId },
      },
    });

    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedTotal = currentQty + quantity;

    // Cap at available stock
    const finalQuantity = Math.min(requestedTotal, variant.stock);

    if (finalQuantity === currentQty) {
      return jsonError(
        "STOCK_LIMIT_REACHED",
        `You already have the maximum available stock (${variant.stock} units) in your cart.`,
        400
      );
    }

    await db.cartItem.upsert({
      where: {
        cartId_variantId: { cartId, variantId },
      },
      create: {
        cartId,
        variantId,
        quantity: finalQuantity,
      },
      update: {
        quantity: finalQuantity,
      },
    });

    const response = jsonSuccess({
      success: true,
      quantity: finalQuantity,
      message:
        finalQuantity < requestedTotal
          ? `Added ${finalQuantity - currentQty} item(s). Quantity was capped at available stock (${variant.stock} units).`
          : "Item added to cart.",
    });

    if (guestId && !req.cookies.get(GUEST_CART_COOKIE)) {
      response.cookies.set(GUEST_CART_COOKIE, guestId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Cart add error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to add item to cart.", 500);
  }
}
