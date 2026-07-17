const { spawnSync } = require("child_process");
const { readdirSync, statSync } = require("fs");
const { join } = require("path");

const roots = ["src", "prisma"];
const files = [];

function walk(dir) {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
    } else if (path.endsWith(".js")) {
      files.push(path);
    }
  }
}

for (const root of roots) {
  walk(root);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

console.log(`Syntax OK (${files.length} files)`);
