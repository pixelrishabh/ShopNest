import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/server/utils/response";

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  addressLine1: z.string().min(5).optional(),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  postalCode: z.string().regex(/^\d{6}$/).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);

    const existing = await db.address.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return jsonError("NOT_FOUND", "Address not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const data = parsed.data;

    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await db.address.update({
      where: { id: params.id },
      data,
    });

    return jsonSuccess({ address: updated });
  } catch (err: any) {
    return jsonError("INTERNAL_ERROR", "Failed to update address", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("UNAUTHORIZED", "Unauthorized", 401);

    const existing = await db.address.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return jsonError("NOT_FOUND", "Address not found", 404);

    await db.address.delete({ where: { id: params.id } });
    return jsonSuccess({ message: "Address deleted successfully" });
  } catch (err: any) {
    return jsonError("INTERNAL_ERROR", "Failed to delete address", 500);
  }
}
