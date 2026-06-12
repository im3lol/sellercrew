import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = join(".next", "standalone");

if (!existsSync(standaloneDir)) {
  throw new Error("Standalone build directory was not created.");
}

mkdirSync(join(standaloneDir, ".next"), { recursive: true });
cpSync(join(".next", "static"), join(standaloneDir, ".next", "static"), {
  recursive: true,
  force: true,
});
cpSync("public", join(standaloneDir, "public"), {
  recursive: true,
  force: true,
});
