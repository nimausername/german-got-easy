import { config } from "dotenv";
import { resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { Prisma, PrismaClient } from "@prisma/client";

config({ path: resolve(process.cwd(), "../.env") });
config();

const prisma = new PrismaClient();

type ExerciseSeed = {
  type: string;
  prompt: string;
  payload: Prisma.InputJsonValue;
};

type LessonSeed = {
  slug: string;
  title: string;
  skillTags: string[];
  exercises: ExerciseSeed[];
};

type UnitSeed = {
  slug: string;
  title: string;
  description?: string;
  lessons: LessonSeed[];
};

type WordSeed = {
  lemma: string;
  article: string | null;
  plural: string | null;
  topic:
    | "ESSENTIALS"
    | "PEOPLE"
    | "TIME"
    | "FOOD_DRINK"
    | "HOME"
    | "SCHOOL_WORK"
    | "TRAVEL"
    | "SHOPPING"
    | "DESCRIPTIONS";
  translation: string;
  partOfSpeech:
    | "NOUN"
    | "VERB"
    | "ADJECTIVE"
    | "ADVERB"
    | "PRONOUN"
    | "PREPOSITION"
    | "CONJUNCTION"
    | "PARTICLE"
    | "OTHER";
  cefrBand: "A1" | "A2" | "B1";
  exampleDe: string;
  exampleEn: string;
  examplePluralDe?: string | null;
  examplePluralEn?: string | null;
  usageNote: string | null;
  frequencyRank: number;
  image?: {
    url: string;
    credit: string;
    license: string;
    sourceUrl: string;
  } | null;
};

/** Initial curated batch is live immediately; later batches wait for the daily drip. */
const isImmediatelyReleasedBatch = (fileName: string): boolean =>
  fileName === "a1-batch-01.json";

const loadWordbankFiles = (): Array<{ fileName: string; words: WordSeed[] }> => {
  const dir = resolve(process.cwd(), "content/wordbank");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  return files.map((fileName) => ({
    fileName,
    words: JSON.parse(readFileSync(resolve(dir, fileName), "utf8")) as WordSeed[],
  }));
};

const seed = async () => {
  const level = await prisma.level.upsert({
    where: { code: "A1" },
    create: { code: "A1", title: "A1 Beginner", sortOrder: 1 },
    update: { title: "A1 Beginner", sortOrder: 1 },
  });

  await prisma.level.upsert({
    where: { code: "A2" },
    create: { code: "A2", title: "A2 Elementary", sortOrder: 2 },
    update: {},
  });

  await prisma.level.upsert({
    where: { code: "B1" },
    create: { code: "B1", title: "B1 Intermediate", sortOrder: 3 },
    update: {},
  });

  const units = JSON.parse(
    readFileSync(resolve(process.cwd(), "content/lessons/a1-unit-1.json"), "utf8"),
  ) as UnitSeed[];

  for (const [unitIndex, unitSeed] of units.entries()) {
    const unit = await prisma.unit.upsert({
      where: { levelId_slug: { levelId: level.id, slug: unitSeed.slug } },
      create: {
        levelId: level.id,
        slug: unitSeed.slug,
        title: unitSeed.title,
        description: unitSeed.description,
        sortOrder: unitIndex + 1,
      },
      update: {
        title: unitSeed.title,
        description: unitSeed.description,
        sortOrder: unitIndex + 1,
      },
    });

    for (const [lessonIndex, lessonSeed] of unitSeed.lessons.entries()) {
      const lesson = await prisma.lesson.upsert({
        where: { unitId_slug: { unitId: unit.id, slug: lessonSeed.slug } },
        create: {
          unitId: unit.id,
          slug: lessonSeed.slug,
          title: lessonSeed.title,
          skillTags: lessonSeed.skillTags,
          sortOrder: lessonIndex + 1,
        },
        update: {
          title: lessonSeed.title,
          skillTags: lessonSeed.skillTags,
          sortOrder: lessonIndex + 1,
        },
      });

      await prisma.exercise.deleteMany({ where: { lessonId: lesson.id } });
      await prisma.exercise.createMany({
        data: lessonSeed.exercises.map((exercise, exerciseIndex) => ({
          lessonId: lesson.id,
          type: exercise.type,
          prompt: exercise.prompt,
          payload: exercise.payload,
          sortOrder: exerciseIndex + 1,
        })),
      });
    }
  }

  console.log("Seeded A1 Unit 1 content.");

  const batches = loadWordbankFiles();
  let seededCount = 0;
  const initialReleasedAt = new Date(0);

  for (const { fileName, words } of batches) {
    const releaseImmediately = isImmediatelyReleasedBatch(fileName);

    for (const word of words) {
      const imageUrl = word.image?.url ?? null;
      const imageCredit = word.image?.credit ?? null;
      const imageLicense = word.image?.license ?? null;
      const imageSourceUrl = word.image?.sourceUrl ?? null;
      const examplePluralDe = word.examplePluralDe ?? null;
      const examplePluralEn = word.examplePluralEn ?? null;

      await prisma.word.upsert({
        where: {
          lemma_article: {
            lemma: word.lemma,
            article: word.article ?? "",
          },
        },
        create: {
          lemma: word.lemma,
          article: word.article ?? "",
          plural: word.plural,
          topic: word.topic,
          translation: word.translation,
          partOfSpeech: word.partOfSpeech,
          cefrBand: word.cefrBand,
          exampleDe: word.exampleDe,
          exampleEn: word.exampleEn,
          examplePluralDe,
          examplePluralEn,
          usageNote: word.usageNote,
          frequencyRank: word.frequencyRank,
          imageUrl,
          imageCredit,
          imageLicense,
          imageSourceUrl,
          releasedAt: releaseImmediately ? initialReleasedAt : null,
        },
        update: {
          plural: word.plural,
          topic: word.topic,
          translation: word.translation,
          partOfSpeech: word.partOfSpeech,
          cefrBand: word.cefrBand,
          exampleDe: word.exampleDe,
          exampleEn: word.exampleEn,
          examplePluralDe,
          examplePluralEn,
          usageNote: word.usageNote,
          frequencyRank: word.frequencyRank,
          imageUrl,
          imageCredit,
          imageLicense,
          imageSourceUrl,
          ...(releaseImmediately ? { releasedAt: initialReleasedAt } : {}),
        },
      });
      seededCount += 1;
    }

    console.log(
      `Seeded ${words.length} words from ${fileName} (${releaseImmediately ? "released" : "queued"}).`,
    );
  }

  console.log(`Seeded ${seededCount} words total.`);

  const { SAMPLE_EXAM_PACK } = await import("../src/content/exam-packs.js");
  await prisma.examPack.upsert({
    where: { slug: SAMPLE_EXAM_PACK.slug },
    create: {
      slug: SAMPLE_EXAM_PACK.slug,
      title: SAMPLE_EXAM_PACK.title,
      levelCode: SAMPLE_EXAM_PACK.levelCode,
      timeLimitSec: SAMPLE_EXAM_PACK.timeLimitSec,
      payload: SAMPLE_EXAM_PACK.payload,
    },
    update: {
      title: SAMPLE_EXAM_PACK.title,
      levelCode: SAMPLE_EXAM_PACK.levelCode,
      timeLimitSec: SAMPLE_EXAM_PACK.timeLimitSec,
      payload: SAMPLE_EXAM_PACK.payload,
    },
  });
  console.log("Seeded sample exam pack.");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
