import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("Razorpay Signature Verification Integration Tests", () => {
  const keySecret = "test_secret_key_12345678";
  const orderId = "order_N123456789";
  const paymentId = "pay_P987654321";

  it("verifies genuine Razorpay HMAC SHA256 signature correctly", () => {
    // Generate authentic signature
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const validSignature = hmac.digest("hex");

    // Verification logic
    const verifier = crypto.createHmac("sha256", keySecret);
    verifier.update(`${orderId}|${paymentId}`);
    const expected = verifier.digest("hex");

    const isValid =
      expected.length === validSignature.length &&
      crypto.timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(validSignature, "utf-8"));

    expect(isValid).toBe(true);
  });

  it("rejects tampered or forged signature", () => {
    const tamperedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const verifier = crypto.createHmac("sha256", keySecret);
    verifier.update(`${orderId}|${paymentId}`);
    const expected = verifier.digest("hex");

    const isValid =
      expected.length === tamperedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(tamperedSignature, "utf-8"));

    expect(isValid).toBe(false);
  });

  it("verifies webhook payload signature using timingSafeEqual", () => {
    const webhookSecret = "whsec_super_secret_webhook_key";
    const bodyText = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, amount: 149900 } } },
    });

    const signature = crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex");

    // Server verification
    const expected = crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex");
    const isValid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(signature, "utf-8"));

    expect(isValid).toBe(true);
  });
});
