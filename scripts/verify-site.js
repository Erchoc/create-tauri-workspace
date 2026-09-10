#!/usr/bin/env node

// Guards the static site.
//
// The translated page is maintained by hand, so the two versions drift unless
// something checks them. This asserts that both pages describe the same
// sections, link to each other, point their canonical URLs at their own
// location, and reference only files that exist.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = join(repositoryRoot, "site");
const origin = "https://erchoc.github.io/create-tauri-workspace";

const pages = [
  {
    label: "English",
    file: "index.html",
    lang: "en",
    canonical: `${origin}/`,
    linksTo: "./zh/",
  },
  {
    label: "Chinese",
    file: "zh/index.html",
    lang: "zh-Hans",
    canonical: `${origin}/zh/`,
    linksTo: "../",
  },
];

const problems = [];

function sectionIds(html) {
  return new Set(
    [...html.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((match) => match[1]),
  );
}

function references(html) {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter(
      (value) =>
        !value.startsWith("http") &&
        !value.startsWith("#") &&
        !value.startsWith("mailto:"),
    );
}

const loaded = pages.map((page) => {
  const path = join(siteRoot, page.file);
  if (!existsSync(path)) {
    problems.push(`missing page: site/${page.file}`);
    return { ...page, html: "" };
  }
  return { ...page, html: readFileSync(path, "utf8"), path };
});

for (const page of loaded) {
  if (!page.html) {
    continue;
  }

  if (!page.html.includes(`<html lang="${page.lang}">`)) {
    problems.push(`${page.file}: expected <html lang="${page.lang}">`);
  }

  if (!page.html.includes(`rel="canonical" href="${page.canonical}"`)) {
    problems.push(`${page.file}: canonical must be ${page.canonical}`);
  }

  if (!page.html.includes(`href="${page.linksTo}"`)) {
    problems.push(`${page.file}: must link to the other language (${page.linksTo})`);
  }

  for (const tag of ["og:title", "og:description", "og:image", "og:url"]) {
    if (!page.html.includes(`property="${tag}"`)) {
      problems.push(`${page.file}: missing ${tag}`);
    }
  }

  // A social card that points at a missing image renders as a blank box.
  for (const reference of references(page.html)) {
    const target = resolve(join(siteRoot, dirname(page.file)), reference);
    if (!existsSync(target)) {
      problems.push(`${page.file}: broken reference ${reference}`);
    }
  }
}

const [english, chinese] = loaded;
if (english.html && chinese.html) {
  const left = sectionIds(english.html);
  const right = sectionIds(chinese.html);
  for (const id of left) {
    if (!right.has(id)) {
      problems.push(`zh/index.html is missing the "${id}" section`);
    }
  }
  for (const id of right) {
    if (!left.has(id)) {
      problems.push(`index.html is missing the "${id}" section`);
    }
  }
}

if (problems.length > 0) {
  console.error("Site verification failed:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(
  `Site looks publishable: ${loaded.length} pages, matching sections, no broken references.`,
);
