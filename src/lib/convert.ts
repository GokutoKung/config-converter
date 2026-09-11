import {
  DEFAULT_OPTIONS,
  type ConversionResult,
  type ConvertOptions,
  type Format,
} from './types';
import { parseToTree } from './parse';
import { renderFromTree } from './render';

export function convert(
  input: string,
  from: Format,
  to: Format,
  options: Partial<ConvertOptions> = {},
): ConversionResult {
  const opts: ConvertOptions = { ...DEFAULT_OPTIONS, ...options };

  const parsed = parseToTree(input, from, opts);
  if (!parsed.ok) {
    return { output: '', ok: false, issues: parsed.issues, keyCount: 0 };
  }

  const rendered = renderFromTree(parsed.tree, to, opts);
  const issues = [...parsed.issues, ...rendered.issues];
  return {
    output: rendered.output,
    ok: !issues.some((i) => i.level === 'error'),
    issues,
    keyCount: rendered.keyCount,
  };
}
