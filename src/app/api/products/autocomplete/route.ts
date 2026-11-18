import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonSuccess } from "@/server/utils/response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return jsonSuccess({ suggestions: [] });
  }

  const products = await db.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { name: true } },
    },
    take: 6,
  });

  const suggestions = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
  }));

  return jsonSuccess({ suggestions });
}
