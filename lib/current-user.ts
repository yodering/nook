import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email },
  });
}
