import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { convert } from './convert';
import { SAMPLE_ENV, SAMPLE_YAML } from './samples';

describe('round-trips', () => {
  it('YAML -> ENV -> YAML preserves the sample semantically', () => {
    const env = convert(SAMPLE_YAML, 'yaml', 'env');
    const yaml = convert(env.output, 'env', 'yaml');
    expect(env.ok).toBe(true);
    expect(yaml.ok).toBe(true);
    expect(parse(yaml.output)).toEqual(parse(SAMPLE_YAML));
  });

  it('ENV -> YAML -> ENV reproduces the sample exactly', () => {
    const yaml = convert(SAMPLE_ENV, 'env', 'yaml');
    const env = convert(yaml.output, 'yaml', 'env');
    expect(env.output).toBe(SAMPLE_ENV.trimEnd());
  });

  it('ENV -> ConfigMap -> ENV reproduces the sample exactly', () => {
    const cfg = convert(SAMPLE_ENV, 'env', 'configmap');
    const env = convert(cfg.output, 'configmap', 'env');
    expect(env.output).toBe(SAMPLE_ENV.trimEnd());
  });

  it('preserves string values that look like other types', () => {
    const env = convert('flag: "true"\ncode: "007"\npi: "3.14"', 'yaml', 'env');
    expect(env.output).toBe('FLAG="true"\nCODE=007\nPI="3.14"');
    const yaml = convert(env.output, 'env', 'yaml');
    const parsed = parse(yaml.output) as Record<string, unknown>;
    expect(parsed.flag).toBe('true');
    expect(parsed.code).toBe('007');
    expect(parsed.pi).toBe('3.14');
  });

  it('preserves URLs and other colon-containing strings', () => {
    const env = convert('url: redis://localhost:6379', 'yaml', 'env');
    expect(env.output).toBe('URL=redis://localhost:6379');
    const yaml = convert(env.output, 'env', 'yaml');
    expect((parse(yaml.output) as Record<string, unknown>).url).toBe(
      'redis://localhost:6379',
    );
  });
});
