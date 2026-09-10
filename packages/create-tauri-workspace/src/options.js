import process from "node:process";
import { resolve } from "node:path";

import { SKILL_TARGETS } from "./skill.js";

export const PLACEHOLDER_REPOSITORY = "OWNER/REPOSITORY";

export function assertIdentifier(identifier) {
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(identifier)) {
    throw new Error(
      "Identifier must be a reverse domain name such as com.example.app.",
    );
  }
  return identifier;
}

export function assertRepository(repository) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error("Repository must look like owner/name.");
  }
  return repository;
}

export function updateEndpoint(repository) {
  const target = repository ?? PLACEHOLDER_REPOSITORY;
  return `https://github.com/${target}/releases/latest/download/latest.json`;
}

function requireValue(argv, index, flag, description) {
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires ${description}.`);
  }
  return value;
}

export function parseArguments(argv) {
  const options = {
    projectName: undefined,
    output: process.cwd(),
    identifier: undefined,
    repository: undefined,
    install: true,
    git: true,
    help: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--no-install") {
      options.install = false;
    } else if (argument === "--no-git") {
      options.git = false;
    } else if (argument === "--output") {
      options.output = resolve(
        requireValue(argv, index, "--output", "a directory"),
      );
      index += 1;
    } else if (argument === "--identifier") {
      options.identifier = assertIdentifier(
        requireValue(argv, index, "--identifier", "a reverse domain name"),
      );
      index += 1;
    } else if (argument === "--repo") {
      options.repository = assertRepository(
        requireValue(argv, index, "--repo", "an owner/name value"),
      );
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--version" || argument === "-v") {
      options.version = true;
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (options.projectName) {
      throw new Error("Only one project name may be provided.");
    } else {
      options.projectName = argument;
    }
  }

  return options;
}

export function parseSkillArguments(argv) {
  const options = {
    action: undefined,
    global: false,
    output: process.cwd(),
    targets: [],
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--global" || argument === "-g") {
      options.global = true;
    } else if (argument === "--claude" || argument === "--codex") {
      options.targets.push(argument.slice(2));
    } else if (argument === "--output") {
      options.output = resolve(
        requireValue(argv, index, "--output", "a directory"),
      );
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (options.action) {
      throw new Error("Only one skill action may be provided.");
    } else {
      options.action = argument;
    }
  }

  if (options.targets.length === 0) {
    options.targets = Object.keys(SKILL_TARGETS);
  }

  return options;
}
