#!/usr/bin/env node

import process from "node:process";

import { main } from "../src/index.js";

main().catch((error) => {
  console.error();
  console.error("Failed to create the workspace.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
