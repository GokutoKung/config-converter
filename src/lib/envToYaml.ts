import { convert } from './convert';
import type { ConversionResult, ConvertOptions } from './types';

export function envToYaml(
  input: string,
  opts: ConvertOptions,
): ConversionResult {
  return convert(input, 'env', 'yaml', opts);
}
