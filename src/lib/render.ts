import { stringify } from 'yaml';
import type { ConfigValue, ConvertOptions, Format, Issue } from './types';
import { flattenTree, renderConfigMapValue, renderEnvValue } from './flatten';

export interface RenderResult {
  output: string;
  issues: Issue[];
  keyCount: number;
}

export function renderFromTree(
  tree: Record<string, ConfigValue>,
  format: Format,
  opts: ConvertOptions,
): RenderResult {
  const { pairs, issues } = flattenTree(tree, opts);
  const keyCount = pairs.length;

  if (keyCount === 0) return { output: '', issues, keyCount: 0 };

  if (format === 'yaml') {
    try {
      const output = stringify(tree, { indent: 2, lineWidth: 0 }).replace(
        /\n$/,
        '',
      );
      return { output, issues, keyCount };
    } catch (err) {
      return {
        output: '',
        issues: [
          ...issues,
          {
            level: 'error',
            message: `Failed to render YAML: ${(err as Error).message}`,
          },
        ],
        keyCount,
      };
    }
  }

  if (format === 'env') {
    const output = pairs
      .map((p) => `${p.key}=${renderEnvValue(p.value, opts)}`)
      .join('\n');
    return { output, issues, keyCount };
  }

  const output = pairs
    .map((p) => `${p.key}: ${renderConfigMapValue(p.value, opts)}`)
    .join('\n');
  return { output, issues, keyCount };
}
