import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export interface AuditLogOptions {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  req?: NextRequest;
}

export async function createAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  details,
  req,
}: AuditLogOptions) {
  try {
    const ipAddress = req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req?.headers.get("user-agent") || "unknown";

    await db.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: entityId || null,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
