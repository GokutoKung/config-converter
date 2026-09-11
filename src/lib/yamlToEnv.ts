import { convert } from './convert';
import type { ConversionResult, ConvertOptions } from './types';

export function yamlToEnv(
  input: string,
  opts: ConvertOptions,
): ConversionResult {
  return convert(input, 'yaml', 'env', opts);
}
