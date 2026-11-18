import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";

const GUEST_CART_COOKIE = "shopnest_guest_cart";

const updateSchema = z.object({
  quantity: z.number().int().min(0),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const { variantId } = params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { quantity } = parsed.data;

    // Determine cart
    const user = await getCurrentUser();
    let cart: any = null;
    if (user) {
      cart = await db.cart.findUnique({ where: { userId: user.id } });
    } else {
      const guestId = req.cookies.get(GUEST_CART_COOKIE)?.value;
      if (guestId) {
        cart = await db.cart.findUnique({ where: { guestId } });
      }
    }

    if (!cart) {
      return jsonError("CART_NOT_FOUND", "Cart not found.", 404);
    }

    if (quantity === 0) {
      await db.cartItem.deleteMany({
        where: { cartId: cart.id, variantId },
      });
      return jsonSuccess({ message: "Item removed from cart" });
    }

    // Check stock
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return jsonError("VARIANT_NOT_FOUND", "Variant not found.", 404);
    }

    const finalQuantity = Math.min(quantity, variant.stock);

    await db.cartItem.update({
      where: {
        cartId_variantId: { cartId: cart.id, variantId },
      },
      data: { quantity: finalQuantity },
    });

    return jsonSuccess({
      success: true,
      quantity: finalQuantity,
      capped: finalQuantity < quantity,
      message:
        finalQuantity < quantity
          ? `Quantity was capped at available stock (${variant.stock} units).`
          : "Cart updated.",
    });
  } catch (err: any) {
    console.error("Cart update error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to update item quantity.", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const { variantId } = params;
    const user = await getCurrentUser();
    let cart: any = null;

    if (user) {
      cart = await db.cart.findUnique({ where: { userId: user.id } });
    } else {
      const guestId = req.cookies.get(GUEST_CART_COOKIE)?.value;
      if (guestId) {
        cart = await db.cart.findUnique({ where: { guestId } });
      }
    }

    if (cart) {
      await db.cartItem.deleteMany({
        where: { cartId: cart.id, variantId },
      });
    }

    return jsonSuccess({ message: "Item removed" });
  } catch (err: any) {
    console.error("Cart delete error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to delete cart item.", 500);
  }
}
