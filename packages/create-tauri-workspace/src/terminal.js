import process from "node:process";

const enabled = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

function style(value, code) {
  return enabled ? `\u001B[${code}m${value}\u001B[0m` : value;
}

export const ansi = {
  bold: (value) => style(value, "1"),
  dim: (value) => style(value, "2"),
  cyan: (value) => style(value, "36"),
  green: (value) => style(value, "32"),
  red: (value) => style(value, "31"),
  yellow: (value) => style(value, "33"),
};

export function printStep(label, detail) {
  console.log(`${ansi.green("  ✓")} ${label}${ansi.dim(`  ${detail}`)}`);
}

export function printWarning(message) {
  console.log(`${ansi.yellow("  !")} ${message}`);
}

export function printFailure(message) {
  console.log(`${ansi.red("  ✗")} ${message}`);
}
