import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "./lib/prisma.js";

async function main() {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME,
  } = process.env;

  if (
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 8
  ) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env"
    );
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
    },
    create: {
      name: ADMIN_NAME || "Administrator",
      email,
      passwordHash: await bcrypt.hash(
        ADMIN_PASSWORD,
        12
      ),
      role: "ADMIN",
    },
  });

  console.log(`Admin account is ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });