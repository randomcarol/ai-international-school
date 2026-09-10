import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const store = join(process.cwd(), "node_modules", ".pnpm");
const packageName = readdirSync(store)
  .filter((name) => name.startsWith("esbuild@"))
  .sort()
  .at(-1);

if (!packageName) throw new Error("The installed toolchain does not contain esbuild.");

const esbuild = join(store, packageName, "node_modules", "esbuild", "bin", "esbuild");
const output = join(process.cwd(), ".test-dist");
rmSync(output, { recursive: true, force: true });

const compile = spawnSync(esbuild, ["tests/learning-domain.test.ts", "--bundle", "--platform=node", "--format=esm", "--outdir=.test-dist"], { stdio: "inherit" });
if (compile.status !== 0) process.exit(compile.status ?? 1);

const test = spawnSync(process.execPath, ["--test", ".test-dist/learning-domain.test.js"], { stdio: "inherit" });
process.exit(test.status ?? 1);
