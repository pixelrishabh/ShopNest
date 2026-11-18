import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("🌱 Database is empty. Running initial database seed...");
      execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
      console.log("✅ Initial seed finished successfully!");
    } else {
      console.log(`ℹ️ Database already contains ${userCount} users. Skipping seed.`);
    }
  } catch (err) {
    console.error("❌ Error during checkAndSeed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
