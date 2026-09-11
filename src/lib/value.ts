const BOOL_RE = /^(true|false)$/i;
const NULL_RE = /^(null|~)$/i;
const INT_RE = /^-?\d+$/;
const FLOAT_RE = /^-?(?:\d*\.\d+|\d+\.\d+[eE][+-]?\d+|\d+[eE][+-]?\d+)$/;

export type ConfigScalar = string | number | boolean | null;

export function looksTyped(raw: string): boolean {
  return BOOL_RE.test(raw) || NULL_RE.test(raw) || isNumericString(raw);
}

function isNumericString(raw: string): boolean {
  if (INT_RE.test(raw)) {
    if (/^-?0\d+$/.test(raw)) return false; // leading zeros stay strings, e.g. "007"
    return Number.isSafeInteger(Number(raw));
  }
  if (FLOAT_RE.test(raw)) {
    return Number.isFinite(Number(raw));
  }
  return false;
}

export function inferScalar(raw: string, inferTypes: boolean): ConfigScalar {
  if (!inferTypes) return raw;
  const t = raw.trim();
  if (t === '') return '';
  if (BOOL_RE.test(t)) return t.toLowerCase() === 'true';
  if (NULL_RE.test(t)) return null;
  if (isNumericString(t)) return Number(t);
  return raw;
}

export function formatScalarBare(value: ConfigScalar): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function formatEnvValue(value: ConfigScalar): string {
  const bare = formatScalarBare(value);
  if (typeof value === 'string' && needsQuoting(value)) {
    return quote(value);
  }
  return bare;
}

function needsQuoting(s: string): boolean {
  if (s === '') return false;
  if (/^\s|\s$/.test(s)) return true;
  if (/[\n\r"'#\\]/.test(s)) return true;
  if (s.includes(',')) return true;
  if (looksTyped(s)) return true;
  return false;
}

function quote(s: string): string {
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

export interface ParsedEnvValue {
  value: string;
  quoted: boolean;
}

export function parseEnvValueText(rhs: string): ParsedEnvValue {
  const trimmed = rhs.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if (first === '"' && last === '"') {
      return { value: unescapeDouble(trimmed.slice(1, -1)), quoted: true };
    }
    if (first === "'" && last === "'") {
      return { value: trimmed.slice(1, -1), quoted: true }; // single quotes are literal
    }
  }
  return { value: trimmed, quoted: false };
}

function unescapeDouble(s: string): string {
  return s.replace(/\\(["\\ntr])/g, (_, ch: string) => {
    switch (ch) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      default:
        return ch;
    }
  });
}
