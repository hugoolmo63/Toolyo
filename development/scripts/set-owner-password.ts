import { hashPassword } from "../src/server/auth/password";
import { prisma } from "../src/server/db/client";

async function main() {
  const email = process.argv[2] ?? "owner-verified-1@toolyo.dev";
  const password = process.argv[3] ?? "passwordpassword123";

  const hash = await hashPassword(password);
  const user = await prisma.user.update({
    where: { emailNormalized: email },
    data: {
      passwordCredential: {
        upsert: { update: { passwordHash: hash }, create: { passwordHash: hash } },
      },
    },
    select: { emailNormalized: true, displayName: true },
  });
  console.log("Password actualizado:", user);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
