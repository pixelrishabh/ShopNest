import { db } from "@/lib/db";

export interface IdempotencyRecord {
  isDuplicate: boolean;
  statusCode?: number;
  responsePayload?: any;
}

/**
 * Check and record an idempotency key.
 * If key already exists and has a response, returns the cached response.
 * If key does not exist, registers the key with 24h TTL.
 */
export async function handleIdempotency(
  key: string,
  path: string,
  requestPayload?: any
): Promise<IdempotencyRecord> {
  const existing = await db.idempotencyKey.findUnique({
    where: { key },
  });

  if (existing) {
    if (existing.responsePayload && existing.statusCode) {
      return {
        isDuplicate: true,
        statusCode: existing.statusCode,
        responsePayload: existing.responsePayload,
      };
    }
    // In progress
    return {
      isDuplicate: true,
      statusCode: 409,
      responsePayload: {
        error: {
          code: "REQUEST_IN_PROGRESS",
          message: "A request with this idempotency key is currently being processed.",
        },
      },
    };
  }

  // Create pending idempotency key
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
  await db.idempotencyKey.create({
    data: {
      key,
      path,
      requestPayload: requestPayload || {},
      expiresAt,
    },
  });

  return { isDuplicate: false };
}

/**
 * Store the final response payload for an idempotency key
 */
export async function saveIdempotencyResponse(
  key: string,
  statusCode: number,
  responsePayload: any
) {
  try {
    await db.idempotencyKey.update({
      where: { key },
      data: {
        statusCode,
        responsePayload,
      },
    });
  } catch (err) {
    console.error("Failed to update idempotency response:", err);
  }
}
