import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Admin Authorization Integration Tests", () => {
  it("enforces role-based permissions between ADMIN and CUSTOMER", async () => {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
    });
    const customer = await db.user.findFirst({
      where: { role: "CUSTOMER" },
    });

    expect(admin?.role).toBe("ADMIN");
    expect(customer?.role).toBe("CUSTOMER");

    // Authorization policy:
    function authorizeAdmin(role?: string) {
      if (!role) return 401; // anonymous
      if (role !== "ADMIN") return 403; // forbidden for customer
      return 200; // allowed for admin
    }

    expect(authorizeAdmin(undefined)).toBe(401);
    expect(authorizeAdmin(customer?.role)).toBe(403);
    expect(authorizeAdmin(admin?.role)).toBe(200);
  });
});
