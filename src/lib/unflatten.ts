import type { ConfigValue, ConvertOptions, Issue } from './types';

export interface FlatEntry {
  key: string;
  value: ConfigValue;
  line?: number;
}

export interface UnflattenResult {
  root: Record<string, ConfigValue>;
  issues: Issue[];
}

function splitKey(key: string, opts: ConvertOptions): string[] {
  return key
    .split(opts.separator)
    .filter((seg) => seg.length > 0)
    .map((seg) => (opts.lowercaseKeys ? seg.toLowerCase() : seg));
}

export function unflattenToObject(
  entries: FlatEntry[],
  opts: ConvertOptions,
): UnflattenResult {
  const root: Record<string, ConfigValue> = {};
  const issues: Issue[] = [];

  for (const entry of entries) {
    const segments = splitKey(entry.key, opts);
    if (segments.length === 0) {
      issues.push({
        level: 'warning',
        message: `Skipped entry with empty key "${entry.key}".`,
        line: entry.line,
      });
      continue;
    }

    let node: Record<string, ConfigValue> = root;
    let collided = false;

    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i];
      const existing = node[seg];
      if (existing === undefined) {
        const next: Record<string, ConfigValue> = {};
        node[seg] = next;
        node = next;
      } else if (
        typeof existing === 'object' &&
        existing !== null &&
        !Array.isArray(existing)
      ) {
        node = existing as Record<string, ConfigValue>;
      } else {
        issues.push({
          level: 'warning',
          message: `Key "${entry.key}" conflicts with an existing value at "${segments
            .slice(0, i + 1)
            .join(opts.separator)}" — overwriting.`,
          line: entry.line,
        });
        const next: Record<string, ConfigValue> = {};
        node[seg] = next;
        node = next;
        collided = true;
      }
    }

    const leaf = segments[segments.length - 1];
    const existingLeaf = node[leaf];
    if (
      !collided &&
      existingLeaf !== undefined &&
      typeof existingLeaf === 'object' &&
      existingLeaf !== null
    ) {
      issues.push({
        level: 'warning',
        message: `Key "${entry.key}" conflicts with a nested group of the same name — overwriting.`,
        line: entry.line,
      });
    }
    node[leaf] = entry.value;
  }

  return { root, issues };
}
