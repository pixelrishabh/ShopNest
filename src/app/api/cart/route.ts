import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";
import crypto from "crypto";

const GUEST_CART_COOKIE = "shopnest_guest_cart";

async function getOrCreateCart(req: NextRequest) {
  const user = await getCurrentUser();
  if (user) {
    let cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: { where: { isPrimary: true }, take: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return { cart, guestId: null };
  }

  // Guest cart via cookie
  let guestId = req.cookies.get(GUEST_CART_COOKIE)?.value;
  let cart: any = null;

  if (guestId) {
    cart = await db.cart.findUnique({
      where: { guestId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  if (!cart) {
    guestId = crypto.randomUUID();
    cart = await db.cart.create({
      data: { guestId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return { cart, guestId };
}

export async function GET(req: NextRequest) {
  try {
    const { cart, guestId } = await getOrCreateCart(req);

    const formattedItems = cart.items.map((item: any) => ({
      id: item.id,
      variantId: item.variantId,
      name: item.variant.product.name,
      variantName: item.variant.name,
      price: item.variant.price,
      mrp: item.variant.mrp,
      gstRate: item.variant.product.gstRate,
      stock: item.variant.stock,
      image: item.variant.product.images[0]?.url || `/images/products/${item.variant.product.slug}.svg`,
      quantity: item.quantity,
    }));

    const response = jsonSuccess({ items: formattedItems });

    if (guestId) {
      response.cookies.set(GUEST_CART_COOKIE, guestId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Cart GET error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve cart items.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await db.cartItem.deleteMany({
        where: { cart: { userId: user.id } },
      });
    } else {
      const guestId = req.cookies.get(GUEST_CART_COOKIE)?.value;
      if (guestId) {
        await db.cartItem.deleteMany({
          where: { cart: { guestId } },
        });
      }
    }

    return jsonSuccess({ message: "Cart cleared" });
  } catch (err: any) {
    console.error("Cart clear error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to clear cart.", 500);
  }
}
