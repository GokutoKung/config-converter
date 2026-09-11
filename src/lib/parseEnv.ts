import type { Issue } from './types';
import { parseEnvValueText } from './value';

export interface EnvToken {
  key: string;
  value: string;
  quoted: boolean;
  line: number;
}

export interface ParseEnvResult {
  tokens: EnvToken[];
  issues: Issue[];
}

const EXPORT_RE = /^\s*export\s+/;

export function parseEnvText(text: string): ParseEnvResult {
  const tokens: EnvToken[] = [];
  const issues: Issue[] = [];

  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;

    let content = rawLine;
    const exportMatch = EXPORT_RE.exec(content);
    if (exportMatch) content = content.slice(exportMatch[0].length);

    const eq = content.indexOf('=');
    if (eq === -1) {
      issues.push({
        level: 'warning',
        message: `Line ${line}: not a KEY=VALUE assignment — skipped.`,
        line,
      });
      return;
    }

    const key = content.slice(0, eq).trim();
    if (key === '') {
      issues.push({
        level: 'warning',
        message: `Line ${line}: empty key — skipped.`,
        line,
      });
      return;
    }
    if (/\s/.test(key)) {
      issues.push({
        level: 'warning',
        message: `Line ${line}: key "${key}" contains whitespace.`,
        line,
      });
    }

    const parsed = parseEnvValueText(content.slice(eq + 1));
    tokens.push({ key, value: parsed.value, quoted: parsed.quoted, line });
  });

  return { tokens, issues };
}
