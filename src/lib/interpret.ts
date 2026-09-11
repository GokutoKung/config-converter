import type { ConfigValue, ConvertOptions } from './types';
import { inferScalar } from './value';
import type { EnvToken } from './parseEnv';

export function interpretRaw(raw: string, opts: ConvertOptions): ConfigValue {
  if (opts.arrays && raw.includes(opts.arrayDelimiter)) {
    return raw
      .split(opts.arrayDelimiter)
      .map((part) => inferScalar(part.trim(), opts.inferTypes));
  }
  return inferScalar(raw, opts.inferTypes);
}

export function interpretToken(
  token: EnvToken,
  opts: ConvertOptions,
): ConfigValue {
  if (token.quoted) return token.value;
  return interpretRaw(token.value, opts);
}
