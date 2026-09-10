import process from "node:process";

import { inspectEnvironment } from "./requirements.js";
import { ansi, printFailure, printStep, printWarning } from "./terminal.js";

function describe(check) {
  const version = check.found ?? "not found";
  const bound = check.minimum ? `needs ${check.minimum} or newer` : "";
  return { version, bound };
}

/**
 * Reports whether this machine can build a generated project.
 *
 * Returns the number of blocking problems so callers can decide whether to
 * stop. Optional tools are reported but never block.
 */
export function runDoctor({ quiet = false } = {}) {
  const checks = inspectEnvironment();
  const blocking = checks.filter((check) => !check.ok && !check.optional);
  const warnings = checks.filter((check) => !check.ok && check.optional);

  if (!quiet || blocking.length > 0) {
    console.log(`\n${ansi.cyan("◆")} ${ansi.bold("Environment check")}\n`);

    for (const check of checks) {
      const { version, bound } = describe(check);
      const label = check.label.padEnd(18);
      const detail = bound ? `${version.padEnd(12)} ${bound}` : version;
      if (check.ok) {
        printStep(label, detail);
      } else if (check.optional) {
        printWarning(`${label}${detail}`);
      } else {
        printFailure(`${label}${detail}`);
      }
    }
  }

  const reported = [...blocking, ...warnings];
  if (reported.length > 0) {
    console.log("");
    for (const check of reported) {
      const heading = check.optional
        ? ansi.yellow(check.label)
        : ansi.red(check.label);
      console.log(`${heading} — ${check.problem}`);
      if (check.reason) {
        console.log(ansi.dim(`  It ${check.reason}`));
      }
      for (const line of check.remedy ?? []) {
        console.log(`  ${ansi.cyan(line)}`);
      }
      console.log("");
    }
  }

  if (blocking.length === 0) {
    if (!quiet) {
      console.log(`\n${ansi.green("This machine is ready.")}\n`);
    }
    return 0;
  }

  console.log(
    `${ansi.red("Not ready.")} Fix the ${blocking.length === 1 ? "problem" : `${blocking.length} problems`} above, then run the check again.\n`,
  );
  return blocking.length;
}

export function doctorCommand() {
  const problems = runDoctor();
  if (problems > 0) {
    process.exitCode = 1;
  }
}
