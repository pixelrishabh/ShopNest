import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(60),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  addressLine1: z.string().min(5, "Flat, House no., Building is required"),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State code or name is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit Indian PIN code"),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHORIZED", "Please sign in to view addresses.", 401);
  }

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return jsonSuccess({ addresses });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("UNAUTHORIZED", "Please sign in to add an address.", 401);
    }

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const data = parsed.data;

    // If marked as default, unset existing defaults
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        landmark: data.landmark || null,
        city: data.city,
        state: data.state.toUpperCase(),
        postalCode: data.postalCode,
        isDefault: data.isDefault,
      },
    });

    return jsonSuccess({ address }, 201);
  } catch (err: any) {
    console.error("Address POST error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to create address.", 500);
  }
}
