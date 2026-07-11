import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const sourceDirectory = path.join(
  process.cwd(),
  ".next/server/chunks/static/wasm",
);
const destinationDirectory = path.join(
  process.cwd(),
  ".open-next/server-functions/default/static/wasm",
);

const files = (await readdir(sourceDirectory)).filter((file) =>
  file.endsWith(".wasm"),
);

if (files.length === 0) {
  throw new Error(`No Prisma WASM files found in ${sourceDirectory}`);
}

await mkdir(destinationDirectory, { recursive: true });
await Promise.all(
  files.map((file) =>
    cp(path.join(sourceDirectory, file), path.join(destinationDirectory, file)),
  ),
);

console.log(`Copied ${files.length} Prisma WASM file(s) into the Worker bundle.`);
