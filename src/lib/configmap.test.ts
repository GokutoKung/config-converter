import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { convert } from './convert';
import { DEFAULT_OPTIONS } from './types';
import type { ConvertOptions } from './types';

const to = (
  input: string,
  target: 'yaml' | 'env' | 'configmap',
  from = 'configmap' as const,
  options: Partial<ConvertOptions> = {},
) => convert(input, from, target, { ...DEFAULT_OPTIONS, ...options });

describe('ConfigMap format', () => {
  const SAMPLE = [
    'NODE_ENV: "DEV"',
    'SERVER_HOST: "0.0.0.0"',
    'SERVER_PORT: "3001"',
    'SERVER_IDLE_TIMEOUT_SECONDS: "120"',
  ].join('\n');

  it('renders ENV as flat quoted KEY: "value" pairs', () => {
    const result = convert('APP_PORT=8080\nAPP_DEBUG=true', 'env', 'configmap');
    expect(result.output).toBe('APP_PORT: "8080"\nAPP_DEBUG: "true"');
  });

  it('renders every value as a string, even numbers and booleans', () => {
    const result = convert('port: 8080\ndebug: true', 'yaml', 'configmap');
    expect(result.output).toBe('PORT: "8080"\nDEBUG: "true"');
  });

  it('flattens nested YAML into flat ConfigMap keys', () => {
    const result = convert(
      'database:\n  host: localhost\n  port: 5432',
      'yaml',
      'configmap',
    );
    expect(result.output).toBe(
      ['DATABASE_HOST: "localhost"', 'DATABASE_PORT: "5432"'].join('\n'),
    );
  });

  it('renders arrays as quoted CSV', () => {
    const result = convert(
      'features:\n  - auth\n  - billing',
      'yaml',
      'configmap',
    );
    expect(result.output).toBe('FEATURES: "auth,billing"');
  });

  it('parses a ConfigMap into ENV', () => {
    expect(to(SAMPLE, 'env').output).toBe(
      [
        'NODE_ENV=DEV',
        'SERVER_HOST=0.0.0.0',
        'SERVER_PORT=3001',
        'SERVER_IDLE_TIMEOUT_SECONDS=120',
      ].join('\n'),
    );
  });

  it('parses a ConfigMap into nested YAML with inferred types', () => {
    const parsed = parse(to(SAMPLE, 'yaml').output) as Record<string, unknown>;
    expect(parsed).toEqual({
      node: { env: 'DEV' },
      server: {
        host: '0.0.0.0',
        port: 3001,
        idle: { timeout: { seconds: 120 } },
      },
    });
  });

  it('round-trips ConfigMap -> ENV -> ConfigMap', () => {
    const env = to(SAMPLE, 'env').output;
    const back = convert(env, 'env', 'configmap').output;
    expect(back).toBe(SAMPLE);
  });

  it('escapes special characters in values', () => {
    const result = convert('note: hi "there"\npath: a\\b', 'yaml', 'configmap');
    expect(result.output).toBe('NOTE: "hi \\"there\\""\nPATH: "a\\\\b"');
  });

  it('errors on a non-mapping ConfigMap', () => {
    const result = convert('- 1\n- 2', 'configmap', 'env');
    expect(result.ok).toBe(false);
    expect(result.issues[0].level).toBe('error');
  });

  it('keeps values as strings when type inference is disabled', () => {
    const parsed = parse(
      to(SAMPLE, 'yaml', 'configmap', { inferTypes: false }).output,
    ) as {
      server: { port: unknown };
    };
    expect(parsed.server.port).toBe('3001');
  });

  it('handles ConfigMap data pasted with leading indentation', () => {
    const indented = ['  NODE_ENV: "DEV"', '  SERVER_PORT: "3001"'].join('\n');
    expect(to(indented, 'env').output).toBe('NODE_ENV=DEV\nSERVER_PORT=3001');
  });

  it('extracts the data section from a full ConfigMap manifest', () => {
    const manifest = [
      'apiVersion: v1',
      'kind: ConfigMap',
      'metadata:',
      '  name: my-config',
      'data:',
      '  NODE_ENV: "DEV"',
      '  SERVER_PORT: "3001"',
    ].join('\n');
    expect(to(manifest, 'env').output).toBe('NODE_ENV=DEV\nSERVER_PORT=3001');
  });

  it('extracts a bare data: block', () => {
    const block = ['data:', '  FOO: "bar"'].join('\n');
    expect(to(block, 'env').output).toBe('FOO=bar');
  });
});
