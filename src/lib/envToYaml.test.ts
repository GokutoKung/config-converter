import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { envToYaml } from './envToYaml';
import { DEFAULT_OPTIONS } from './types';
import type { ConvertOptions } from './types';

const run = (env: string, options: Partial<ConvertOptions> = {}) =>
  envToYaml(env, { ...DEFAULT_OPTIONS, ...options });

describe('envToYaml', () => {
  it('splits keys into nested, lowercased mappings', () => {
    const result = run(
      ['DATABASE_HOST=localhost', 'DATABASE_PORT=5432'].join('\n'),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe(
      ['database:', '  host: localhost', '  port: 5432'].join('\n'),
    );
    expect(parse(result.output)).toEqual({
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('infers booleans and numbers', () => {
    const result = run(['APP_DEBUG=true', 'APP_PORT=8080'].join('\n'));
    expect(parse(result.output)).toEqual({
      app: { debug: true, port: 8080 },
    });
  });

  it('parses comma-separated values into arrays', () => {
    const result = run('FEATURES=auth,billing,analytics');
    expect(parse(result.output)).toEqual({
      features: ['auth', 'billing', 'analytics'],
    });
  });

  it('keeps quoted values as strings without inference or splitting', () => {
    const result = run(['VERSION="1.0"', 'CSV="a,b,c"'].join('\n'));
    const parsed = parse(result.output) as Record<string, unknown>;
    expect(parsed.version).toBe('1.0');
    expect(parsed.csv).toBe('a,b,c');
  });

  it('ignores comments, blank lines, and the export prefix', () => {
    const result = run(['# a comment', '', 'export FOO=bar'].join('\n'));
    expect(result.issues).toHaveLength(0);
    expect(parse(result.output)).toEqual({ foo: 'bar' });
  });

  it('warns on malformed lines', () => {
    const result = run(['GOOD=1', 'this-is-not-valid'].join('\n'));
    expect(result.issues.some((i) => i.line === 2)).toBe(true);
    expect(parse(result.output)).toEqual({ good: 1 });
  });

  it('warns on duplicate keys and keeps the last value', () => {
    const result = run(['FOO=1', 'FOO=2'].join('\n'));
    expect(result.issues.some((i) => i.message.includes('Duplicate'))).toBe(
      true,
    );
    expect(parse(result.output)).toEqual({ foo: 2 });
  });

  it('warns when a key collides with a nested group', () => {
    const result = run(['A=1', 'A_B=2'].join('\n'));
    expect(result.issues.some((i) => i.level === 'warning')).toBe(true);
  });

  it('keeps values as strings when inference is disabled', () => {
    const result = run('PORT=8080', { inferTypes: false });
    expect(parse(result.output)).toEqual({ port: '8080' });
  });

  it('keeps comma values as strings when arrays are disabled', () => {
    const result = run('LIST=a,b,c', { arrays: false });
    expect(parse(result.output)).toEqual({ list: 'a,b,c' });
  });

  it('preserves key case when lowercaseKeys is disabled', () => {
    const result = run('FOO_BAR=1', { lowercaseKeys: false });
    expect(parse(result.output)).toEqual({ FOO: { BAR: 1 } });
  });

  it('handles empty input', () => {
    const result = run('');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('');
    expect(result.keyCount).toBe(0);
  });
});
