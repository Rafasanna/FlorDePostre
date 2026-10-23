import { mkdir, writeFile, symlink, lstat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { execFileSync, spawn, spawnSync } from "node:child_process";
const baseline = process.argv[2] === "baseline";
const root = process.cwd(),
  vite = resolve("node_modules/vite/bin/vite.js");
if (baseline) {
  const base = resolve(".local/public-baseline");
  await mkdir(base, { recursive: true });
  const paths = execFileSync(
    "git",
    [
      "ls-tree",
      "-r",
      "--name-only",
      "7557dd8",
      "--",
      "src",
      "index.html",
      "vite.config.js",
    ],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n");
  for (const path of paths) {
    await mkdir(dirname(resolve(base, path)), { recursive: true });
    await writeFile(
      resolve(base, path),
      execFileSync("git", ["show", `7557dd8:${path}`]),
    );
  }
  for (const name of ["node_modules", "public"]) {
    try {
      await lstat(resolve(base, name));
    } catch {
      await symlink(resolve(root, name), resolve(base, name), "dir");
    }
  }
  await writeFile(
    resolve(base, "package.json"),
    '{"type":"module","private":true}',
  );
  const built = spawnSync(
    process.execPath,
    [vite, "build", base, "--outDir", resolve(".local/baseline-build")],
    { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
  );
  if (built.status !== 0) process.exit(1);
} else {
  const built = spawnSync(process.execPath, [vite, "build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      ADMIN_DEMO_MODE: "local",
      ADMIN_BUILD_DIR: ".local/production-test",
    },
  });
  if (built.status !== 0) process.exit(1);
}
const child = spawn(
  process.execPath,
  [
    vite,
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    baseline ? "4192" : "4191",
    "--strictPort",
    "--outDir",
    baseline ? ".local/baseline-build" : ".local/production-test",
  ],
  { stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code || 0));
