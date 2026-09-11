import type { ConfigValue, ConvertOptions, Issue } from './types';
import { formatEnvValue, formatScalarBare, type ConfigScalar } from './value';

export type FlatValue =
  | { kind: 'scalar'; value: ConfigScalar }
  | { kind: 'array'; items: ConfigScalar[] };

export interface FlatPair {
  key: string;
  value: FlatValue;
}

export interface FlattenResult {
  pairs: FlatPair[];
  issues: Issue[];
}

function isPlainObject(v: unknown): v is Record<string, ConfigValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isScalar(v: unknown): v is ConfigScalar {
  return v === null || typeof v !== 'object';
}

function sanitizeSegment(seg: string): string {
  return seg.replace(/[^A-Za-z0-9_]/g, '_');
}

function arrayIsSimpleScalars(arr: ConfigValue[], delimiter: string): boolean {
  return arr.every((el) => {
    if (!isScalar(el)) return false;
    const s = formatScalarBare(el);
    return !s.includes(delimiter) && !/[\n\r]/.test(s);
  });
}

function finalizeKey(segments: string[], opts: ConvertOptions): string {
  const joined = segments.join(opts.separator);
  return opts.uppercase ? joined.toUpperCase() : joined;
}

function walk(
  node: ConfigValue,
  segments: string[],
  opts: ConvertOptions,
  pairs: FlatPair[],
): void {
  if (isPlainObject(node)) {
    const entries = Object.entries(node);
    if (entries.length === 0) {
      // Emit an empty leaf only when nested, never for an empty root.
      if (segments.length > 0) {
        pairs.push({
          key: finalizeKey(segments, opts),
          value: { kind: 'scalar', value: '' },
        });
      }
      return;
    }
    for (const [k, v] of entries) {
      walk(v, [...segments, sanitizeSegment(k)], opts, pairs);
    }
    return;
  }

  if (Array.isArray(node)) {
    if (node.length === 0) {
      if (segments.length > 0) {
        pairs.push({
          key: finalizeKey(segments, opts),
          value: { kind: 'array', items: [] },
        });
      }
      return;
    }
    if (opts.arrays && arrayIsSimpleScalars(node, opts.arrayDelimiter)) {
      pairs.push({
        key: finalizeKey(segments, opts),
        value: { kind: 'array', items: node as ConfigScalar[] },
      });
      return;
    }
    // Arrays of objects (or non-joinable scalars) fall back to indexed keys.
    node.forEach((el, i) => {
      walk(el, [...segments, String(i)], opts, pairs);
    });
    return;
  }

  pairs.push({
    key: finalizeKey(segments, opts),
    value: { kind: 'scalar', value: node },
  });
}

export function flattenTree(
  root: ConfigValue,
  opts: ConvertOptions,
): FlattenResult {
  const pairs: FlatPair[] = [];
  const issues: Issue[] = [];
  walk(root, [], opts, pairs);

  const seen = new Map<string, number>();
  for (const { key } of pairs) {
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      issues.push({
        level: 'warning',
        message: `Duplicate key "${key}" produced ${count} times — later values win.`,
      });
    }
  }

  return { pairs, issues };
}

export function renderEnvValue(value: FlatValue, opts: ConvertOptions): string {
  if (value.kind === 'array') {
    return value.items.map(formatScalarBare).join(opts.arrayDelimiter);
  }
  return formatEnvValue(value.value);
}

// ConfigMap `data` values must always be strings, so quote everything.
export function renderConfigMapValue(
  value: FlatValue,
  opts: ConvertOptions,
): string {
  const raw =
    value.kind === 'array'
      ? value.items.map(formatScalarBare).join(opts.arrayDelimiter)
      : formatScalarBare(value.value);
  return JSON.stringify(raw);
}
