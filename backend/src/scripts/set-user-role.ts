import { createDatabaseClient } from "@dancingissogood/db";

const emailArgumentIndex = process.argv.indexOf("--email");
const roleArgumentIndex = process.argv.indexOf("--role");
const email = process.argv[emailArgumentIndex + 1]?.trim().toLowerCase();
const role = process.argv[roleArgumentIndex + 1];

if (emailArgumentIndex === -1 || !email || roleArgumentIndex === -1 || !role) {
  throw new Error("Usage: npm run user:set-role -- --email user@example.com --role ADMIN|MEMBER");
}

if (role !== "ADMIN" && role !== "MEMBER") {
  throw new Error("Role must be ADMIN or MEMBER.");
}

const database = createDatabaseClient();

try {
  const user = await database.userProfile.findFirst({
    select: { email: true, id: true, role: true },
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    throw new Error(
      "No synchronized account has this verified email. Sign in once before assigning a role.",
    );
  }

  const updated = await database.userProfile.update({
    data: { role },
    select: { email: true, id: true, role: true },
    where: { id: user.id },
  });

  console.log(JSON.stringify(updated));
} finally {
  await database.$disconnect();
}
