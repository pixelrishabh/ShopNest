import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Catalog & Products Integration Tests", () => {
  it("has at least 8 categories seeded in DB", async () => {
    const count = await db.category.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  it("has at least 40 products seeded with variants, stock and GST rates", async () => {
    const products = await db.product.findMany({
      include: {
        variants: true,
        images: true,
        category: true,
      },
    });

    expect(products.length).toBeGreaterThanOrEqual(40);

    for (const prod of products) {
      expect(prod.basePrice).toBeGreaterThan(0);
      expect(Number.isInteger(prod.basePrice)).toBe(true);
      expect([0, 5, 12, 18, 28]).toContain(prod.gstRate);
      expect(prod.variants.length).toBeGreaterThanOrEqual(1);
      expect(prod.images.length).toBeGreaterThanOrEqual(1);
      expect(prod.category).not.toBeNull();
      expect(prod.variants[0].stock).toBeGreaterThanOrEqual(0);
    }
  });

  it("searches products by brand and title substring", async () => {
    const results = await db.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: "OnePlus", mode: "insensitive" } },
          { brand: { contains: "OnePlus", mode: "insensitive" } },
        ],
      },
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].brand).toBe("OnePlus");
  });
});
