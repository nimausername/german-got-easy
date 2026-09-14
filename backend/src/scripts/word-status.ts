import { prisma } from "../lib/prisma.js";

const main = async () => {
  const total = await prisma.word.count();
  const released = await prisma.word.count({ where: { releasedAt: { not: null } } });
  const queued = await prisma.word.count({ where: { releasedAt: null } });
  const hasModel = typeof prisma.wordReleaseDay?.findUnique === "function";
  const days = hasModel ? await prisma.wordReleaseDay.count() : -1;
  console.log(JSON.stringify({ total, released, queued, hasWordReleaseDay: hasModel, releaseDays: days }, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
