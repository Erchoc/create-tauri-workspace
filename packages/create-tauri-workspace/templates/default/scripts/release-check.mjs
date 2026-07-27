import { readFileSync } from "node:fs";

const configPath = new URL("../crates/app/tauri.conf.json", import.meta.url);
const config = JSON.parse(readFileSync(configPath, "utf8"));
const problems = [];

if (config.identifier.startsWith("com.example.")) {
  problems.push("replace the placeholder Tauri identifier");
}

if (config.productName.length === 0) {
  problems.push("set a product name");
}

if (problems.length > 0) {
  console.error("Release check failed:");
  for (const problem of problems) {
    console.error("- " + problem);
  }
  process.exitCode = 1;
} else {
  console.log("Release metadata looks ready.");
}
