import { config } from "dotenv";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(process.cwd(), "../.env") });
config();

const prisma = new PrismaClient();

type ExerciseSeed = {
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
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

  const wordbankPath = resolve(process.cwd(), "content/wordbank/a1-batch-01.json");
  const words = JSON.parse(readFileSync(wordbankPath, "utf8")) as Array<{
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
    partOfSpeech: "NOUN" | "VERB" | "ADJECTIVE" | "ADVERB" | "PRONOUN" | "PREPOSITION" | "CONJUNCTION" | "PARTICLE" | "OTHER";
    cefrBand: "A1" | "A2" | "B1";
    exampleDe: string;
    exampleEn: string;
    usageNote: string | null;
    frequencyRank: number;
  }>;

  // Upsert word bank so topic/plural corrections apply without wiping learner progress.
  for (const word of words) {
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
        usageNote: word.usageNote,
        frequencyRank: word.frequencyRank,
      },
      update: {
        plural: word.plural,
        topic: word.topic,
        translation: word.translation,
        partOfSpeech: word.partOfSpeech,
        cefrBand: word.cefrBand,
        exampleDe: word.exampleDe,
        exampleEn: word.exampleEn,
        usageNote: word.usageNote,
        frequencyRank: word.frequencyRank,
      },
    });
  }

  console.log(`Seeded ${words.length} words.`);
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
