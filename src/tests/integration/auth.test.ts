import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";

describe("Auth Integration Tests", () => {
  it("hashes password with cost >= 12 and verifies correctly", async () => {
    const rawPass = "SecureCustomerPass123!";
    const hash = await hashPassword(rawPass);

    expect(hash).not.toBe(rawPass);
    expect(hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$")).toBe(true);

    const isMatch = await verifyPassword(rawPass, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongPassword!", hash);
    expect(isWrong).toBe(false);
  }, 15000);

  it("creates and verifies valid JWT session tokens", async () => {
    const sessionUser = {
      id: "test-user-1",
      email: "test@shopnest.in",
      name: "Test User",
      role: "CUSTOMER" as const,
    };

    const token = await createSessionToken(sessionUser);
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe(sessionUser.email);
    expect(decoded?.role).toBe("CUSTOMER");
  });

  it("verifies seeded admin and customer exist in the database", async () => {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("ADMIN");

    const customer = await db.user.findFirst({
      where: { role: "CUSTOMER" },
    });
    expect(customer).not.toBeNull();
    expect(customer?.role).toBe("CUSTOMER");
    expect(customer?.isSuspended).toBe(false);
  });
});
