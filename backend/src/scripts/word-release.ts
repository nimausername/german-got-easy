import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { releaseNextWords } from "../services/word-release.js";

const main = async () => {
  const result = await releaseNextWords({
    limit: env.WORD_DAILY_RELEASE_LIMIT,
  });
  console.log(JSON.stringify({ data: result, meta: {} }, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
