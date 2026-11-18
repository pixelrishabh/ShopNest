import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/server/middleware/rate-limiter";
import { jsonError, jsonSuccess } from "@/server/utils/response";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = await checkRateLimit(`login:${ip}`, 10, 60);
    if (!rl.success) {
      return jsonError("RATE_LIMIT_EXCEEDED", "Too many login attempts. Please wait a minute.", 429);
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return jsonError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    if (user.isSuspended) {
      return jsonError("ACCOUNT_SUSPENDED", "Your account has been suspended. Please contact support.", 403);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return jsonError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);

    // Merge Guest Cart if present
    const guestCartId = req.cookies.get("shopnest_guest_cart")?.value;
    if (guestCartId) {
      try {
        const guestCart = await db.cart.findUnique({
          where: { guestId: guestCartId },
          include: { items: true },
        });

        if (guestCart && guestCart.items.length > 0) {
          // Get or create user's cart
          let userCart = await db.cart.findUnique({
            where: { userId: user.id },
          });

          if (!userCart) {
            userCart = await db.cart.create({
              data: { userId: user.id },
            });
          }

          // Merge each item
          for (const item of guestCart.items) {
            await db.cartItem.upsert({
              where: {
                cartId_variantId: {
                  cartId: userCart.id,
                  variantId: item.variantId,
                },
              },
              create: {
                cartId: userCart.id,
                variantId: item.variantId,
                quantity: item.quantity,
              },
              update: {
                quantity: { increment: item.quantity },
              },
            });
          }

          // Clean up guest cart
          await db.cart.delete({ where: { id: guestCart.id } });
        }
      } catch (mergeErr) {
        console.error("Cart merge error:", mergeErr);
      }
    }

    const response = jsonSuccess({ user: sessionUser, message: "Logged in successfully" }, 200);
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    if (guestCartId) {
      response.cookies.delete("shopnest_guest_cart");
    }

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return jsonError("INTERNAL_ERROR", "Login failed due to a server error.", 500);
  }
}
