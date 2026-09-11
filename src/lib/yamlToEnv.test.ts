import { describe, it, expect } from 'vitest';
import { yamlToEnv } from './yamlToEnv';
import { DEFAULT_OPTIONS } from './types';

const run = (yaml: string) => yamlToEnv(yaml, DEFAULT_OPTIONS);

describe('yamlToEnv', () => {
  it('flattens nested mappings with underscores and uppercase keys', () => {
    const result = run(`database:
  host: localhost
  credentials:
    user: admin`);
    expect(result.ok).toBe(true);
    expect(result.output).toBe(
      ['DATABASE_HOST=localhost', 'DATABASE_CREDENTIALS_USER=admin'].join('\n'),
    );
    expect(result.keyCount).toBe(2);
  });

  it('renders booleans and numbers unquoted', () => {
    const result = run(`app:
  debug: true
  port: 8080`);
    expect(result.output).toBe(['APP_DEBUG=true', 'APP_PORT=8080'].join('\n'));
  });

  it('joins scalar arrays with commas', () => {
    const result = run(`features:
  - auth
  - billing
  - analytics`);
    expect(result.output).toBe('FEATURES=auth,billing,analytics');
  });

  it('uses indexed keys for arrays of objects', () => {
    const result = run(`servers:
  - host: a
    port: 1
  - host: b
    port: 2`);
    expect(result.output).toBe(
      [
        'SERVERS_0_HOST=a',
        'SERVERS_0_PORT=1',
        'SERVERS_1_HOST=b',
        'SERVERS_1_PORT=2',
      ].join('\n'),
    );
  });

  it('quotes string values that look like other types', () => {
    const result = run(`values:
  version: "1.0"
  flag: "true"
  code: "007"`);
    expect(result.output).toBe(
      ['VALUES_VERSION="1.0"', 'VALUES_FLAG="true"', 'VALUES_CODE=007'].join(
        '\n',
      ),
    );
  });

  it('quotes strings containing commas so they are not read as arrays', () => {
    const result = run(`note: "a, b, c"`);
    expect(result.output).toBe('NOTE="a, b, c"');
  });

  it('respects uppercase=false', () => {
    const result = yamlToEnv('Foo:\n  Bar: 1', {
      ...DEFAULT_OPTIONS,
      uppercase: false,
    });
    expect(result.output).toBe('Foo_Bar=1');
  });

  it('returns an error for a non-mapping root', () => {
    const result = run('- 1\n- 2');
    expect(result.ok).toBe(false);
    expect(result.issues[0].level).toBe('error');
  });

  it('returns an error for invalid YAML with a line number', () => {
    const result = run('foo: [unclosed');
    expect(result.ok).toBe(false);
    expect(result.issues[0].level).toBe('error');
    expect(result.issues[0].line).toBeGreaterThan(0);
  });

  it('handles empty input', () => {
    const result = run('   ');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('');
    expect(result.keyCount).toBe(0);
  });

  it('dedents an indented YAML snippet before parsing', () => {
    const snippet = '  host: localhost\n  port: 5432';
    expect(run(snippet).output).toBe('HOST=localhost\nPORT=5432');
  });

  it('handles hundreds of keys quickly', () => {
    const lines = Array.from({ length: 500 }, (_, i) => `key${i}: ${i}`);
    const start = performance.now();
    const result = run(lines.join('\n'));
    const elapsed = performance.now() - start;
    expect(result.keyCount).toBe(500);
    expect(elapsed).toBeLessThan(500);
  });
});
