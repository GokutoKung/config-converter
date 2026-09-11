import { parse as parseYaml, YAMLParseError } from 'yaml';
import type { ConfigValue, ConvertOptions, Format, Issue } from './types';
import { parseEnvText, type EnvToken } from './parseEnv';
import { unflattenToObject, type FlatEntry } from './unflatten';
import { interpretRaw, interpretToken } from './interpret';

export interface ParseResult {
  tree: Record<string, ConfigValue>;
  issues: Issue[];
  ok: boolean;
}

function isPlainObject(v: unknown): v is Record<string, ConfigValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasError(issues: Issue[]): boolean {
  return issues.some((i) => i.level === 'error');
}

// Strip the common leading indentation so a snippet copied from inside a larger
// document (e.g. the indented `data:` section of a ConfigMap) still parses.
function dedent(text: string): string {
  const lines = text.split('\n');
  let min = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const indent = line.length - line.trimStart().length;
    if (indent < min) min = indent;
  }
  if (min === Infinity || min === 0) return text;
  return lines
    .map((line) => (line.trim() === '' ? line : line.slice(min)))
    .join('\n');
}

function yamlErrorIssue(err: unknown, kind: string): Issue {
  if (err instanceof YAMLParseError) {
    const pos = err.linePos?.[0];
    const where = pos ? ` (line ${pos.line}, col ${pos.col})` : '';
    const issue: Issue = {
      level: 'error',
      message: `Invalid ${kind}${where}: ${err.message.split('\n')[0]}`,
    };
    if (pos) issue.line = pos.line;
    return issue;
  }
  if (err instanceof Error)
    return { level: 'error', message: `Invalid ${kind}: ${err.message}` };
  return { level: 'error', message: `Invalid ${kind} input.` };
}

export function parseToTree(
  input: string,
  format: Format,
  opts: ConvertOptions,
): ParseResult {
  switch (format) {
    case 'yaml':
      return parseYamlInput(input);
    case 'env':
      return parseEnvInput(input, opts);
    case 'configmap':
      return parseConfigMapInput(input, opts);
  }
}

function parseYamlInput(input: string): ParseResult {
  const text = dedent(input);
  if (text.trim() === '') return { tree: {}, issues: [], ok: true };

  let doc: unknown;
  try {
    doc = parseYaml(text);
  } catch (err) {
    return { tree: {}, issues: [yamlErrorIssue(err, 'YAML')], ok: false };
  }

  if (doc === null || doc === undefined)
    return { tree: {}, issues: [], ok: true };

  if (!isPlainObject(doc)) {
    return {
      tree: {},
      issues: [
        {
          level: 'error',
          message:
            'The root of the YAML document must be a mapping (key: value), not a scalar or a list.',
        },
      ],
      ok: false,
    };
  }

  return { tree: doc, issues: [], ok: true };
}

function detectDuplicates(tokens: EnvToken[]): Issue[] {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token.key, (counts.get(token.key) ?? 0) + 1);
  }
  const issues: Issue[] = [];
  for (const [key, count] of counts) {
    if (count > 1) {
      issues.push({
        level: 'warning',
        message: `Duplicate key "${key}" appears ${count} times — later values win.`,
      });
    }
  }
  return issues;
}

function parseEnvInput(input: string, opts: ConvertOptions): ParseResult {
  const { tokens, issues } = parseEnvText(input);
  const entries: FlatEntry[] = tokens.map((token) => ({
    key: token.key,
    line: token.line,
    value: interpretToken(token, opts),
  }));
  const { root, issues: unflattenIssues } = unflattenToObject(entries, opts);
  const all = [...issues, ...detectDuplicates(tokens), ...unflattenIssues];
  return { tree: root, issues: all, ok: !hasError(all) };
}

function parseConfigMapInput(input: string, opts: ConvertOptions): ParseResult {
  const text = dedent(input);
  if (text.trim() === '') return { tree: {}, issues: [], ok: true };

  let doc: unknown;
  try {
    doc = parseYaml(text);
  } catch (err) {
    return { tree: {}, issues: [yamlErrorIssue(err, 'ConfigMap')], ok: false };
  }

  if (doc === null || doc === undefined)
    return { tree: {}, issues: [], ok: true };

  if (!isPlainObject(doc)) {
    return {
      tree: {},
      issues: [
        {
          level: 'error',
          message: 'A ConfigMap must be a flat mapping of KEY: "value" pairs.',
        },
      ],
      ok: false,
    };
  }

  // A whole manifest was pasted — use just its `data:` section.
  const looksLikeManifest =
    isPlainObject(doc.data) &&
    (doc.kind === 'ConfigMap' ||
      'apiVersion' in doc ||
      Object.keys(doc).length === 1);
  const source: Record<string, ConfigValue> = looksLikeManifest
    ? (doc.data as Record<string, ConfigValue>)
    : doc;

  const issues: Issue[] = [];
  const entries: FlatEntry[] = [];
  for (const [key, value] of Object.entries(source)) {
    if (value !== null && typeof value === 'object') {
      issues.push({
        level: 'warning',
        message: `Key "${key}" has a non-scalar value; ConfigMap data values should be strings.`,
      });
    }
    const raw = value === null || value === undefined ? '' : String(value);
    entries.push({ key, value: interpretRaw(raw, opts) });
  }

  const { root, issues: unflattenIssues } = unflattenToObject(entries, opts);
  const all = [...issues, ...unflattenIssues];
  return { tree: root, issues: all, ok: !hasError(all) };
}
