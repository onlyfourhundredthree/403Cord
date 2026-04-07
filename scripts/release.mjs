#!/usr/bin/node
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));

const currentVersion = pkg.version;
const versionParts = currentVersion.split(".").map(Number);
versionParts[2]++;
const newVersion = versionParts.join(".");
pkg.version = newVersion;

writeFileSync("package.json", JSON.stringify(pkg, null, 4) + "\n");
console.log(`Version bumped: ${currentVersion} -> ${newVersion}`);

console.log("\nRunning lint fix...");
execSync("pnpm lint --fix", { stdio: "inherit" });

console.log("\nRunning stylelint fix...");
execSync("pnpm lint-styles --fix", { stdio: "inherit" });

console.log("\nCommitting changes...");
execSync("git add -A", { stdio: "inherit" });
execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: "inherit" });

console.log("\nPushing commit...");
execSync("git push origin main", { stdio: "inherit" });

console.log(`\nCreating tag v${newVersion}...`);
execSync(`git tag v${newVersion}`, { stdio: "inherit" });

console.log(`\nPushing tag v${newVersion}...`);
execSync(`git push origin v${newVersion}`, { stdio: "inherit" });

console.log(`\n✅ Done! v${newVersion} released. Check GitHub Actions for build status.`);
console.log(`📦 Release URL: https://github.com/onlyfourhundredthree/403Cord/releases/tag/v${newVersion}`);