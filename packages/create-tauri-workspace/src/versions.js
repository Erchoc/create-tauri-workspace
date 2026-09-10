// A deliberately small version comparison. Toolchain versions are plain
// numeric releases, so a full semver parser would be more surface than the
// problem needs.

// Minor and patch are optional so that a range such as ">=24" parses the same
// way as a reported version such as "v24.1.0".
export function parseVersion(value) {
  const match = /(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(value ?? "");
  if (!match) {
    return undefined;
  }
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

/** Negative when `a` is older than `b`, zero when they are equal. */
export function compareVersions(a, b) {
  const left = Array.isArray(a) ? a : parseVersion(a);
  const right = Array.isArray(b) ? b : parseVersion(b);
  if (!left || !right) {
    throw new Error(`Cannot compare versions: ${a} and ${b}`);
  }
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function satisfies(found, minimum) {
  const parsed = parseVersion(found);
  return parsed !== undefined && compareVersions(parsed, minimum) >= 0;
}
