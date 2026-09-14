import { createReadStream, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), "../.env") });
config();

const force = process.argv.includes("--force");

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

/**
 * Uploads hashed lesson MP3s from content/audio to Cloudflare R2.
 * Skips objects that already exist unless --force is passed.
 */
const main = async (): Promise<void> => {
  const bucket = requireEnv("R2_BUCKET");
  const endpoint = requireEnv("R2_ENDPOINT");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");

  const audioDir = resolve(process.cwd(), "content/audio");
  const files = readdirSync(audioDir).filter((name) => /^[a-f0-9]{32}\.mp3$/.test(name));

  if (files.length === 0) {
    console.log(`No MP3 files found in ${audioDir}`);
    return;
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  let uploaded = 0;
  let skipped = 0;

  for (const fileName of files) {
    const key = fileName;
    if (!force) {
      try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        skipped += 1;
        continue;
      } catch {
        // Object missing — upload below.
      }
    }

    const filePath = resolve(audioDir, fileName);
    const size = statSync(filePath).size;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: createReadStream(filePath),
        ContentType: "audio/mpeg",
        CacheControl: "public, max-age=31536000, immutable",
        ContentLength: size,
      }),
    );
    uploaded += 1;
    console.log(`uploaded ${key}`);
  }

  console.log(
    `Done. uploaded=${uploaded} skipped=${skipped} total=${files.length} bucket=${bucket}`,
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
