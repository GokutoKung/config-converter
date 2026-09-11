import { describe, it, expect } from 'vitest';
import {
  inferScalar,
  formatEnvValue,
  formatScalarBare,
  parseEnvValueText,
  looksTyped,
} from './value';

describe('inferScalar', () => {
  it('infers booleans (case-insensitive)', () => {
    expect(inferScalar('true', true)).toBe(true);
    expect(inferScalar('false', true)).toBe(false);
    expect(inferScalar('TRUE', true)).toBe(true);
  });

  it('infers integers and floats', () => {
    expect(inferScalar('42', true)).toBe(42);
    expect(inferScalar('-7', true)).toBe(-7);
    expect(inferScalar('3.14', true)).toBe(3.14);
    expect(inferScalar('1e3', true)).toBe(1000);
  });

  it('keeps leading-zero identifiers as strings', () => {
    expect(inferScalar('007', true)).toBe('007');
    expect(inferScalar('0', true)).toBe(0);
  });

  it('keeps unsafe-precision integers as strings', () => {
    expect(inferScalar('999999999999999999999', true)).toBe(
      '999999999999999999999',
    );
  });

  it('infers null from null and ~', () => {
    expect(inferScalar('null', true)).toBeNull();
    expect(inferScalar('~', true)).toBeNull();
  });

  it('treats empty string as empty string', () => {
    expect(inferScalar('', true)).toBe('');
  });

  it('leaves plain text as a string', () => {
    expect(inferScalar('hello', true)).toBe('hello');
    expect(inferScalar('redis://localhost:6379', true)).toBe(
      'redis://localhost:6379',
    );
  });

  it('keeps everything a string when inference is disabled', () => {
    expect(inferScalar('42', false)).toBe('42');
    expect(inferScalar('true', false)).toBe('true');
  });
});

describe('looksTyped', () => {
  it('detects values that would be re-typed', () => {
    expect(looksTyped('true')).toBe(true);
    expect(looksTyped('42')).toBe(true);
    expect(looksTyped('null')).toBe(true);
    expect(looksTyped('hello')).toBe(false);
  });
});

describe('formatScalarBare', () => {
  it('renders scalars without quoting', () => {
    expect(formatScalarBare('hello')).toBe('hello');
    expect(formatScalarBare(42)).toBe('42');
    expect(formatScalarBare(true)).toBe('true');
    expect(formatScalarBare(null)).toBe('');
  });
});

describe('formatEnvValue', () => {
  it('renders plain scalars', () => {
    expect(formatEnvValue(42)).toBe('42');
    expect(formatEnvValue(true)).toBe('true');
    expect(formatEnvValue(null)).toBe('');
    expect(formatEnvValue('plain')).toBe('plain');
  });

  it('quotes strings that would otherwise be re-typed', () => {
    expect(formatEnvValue('true')).toBe('"true"');
    expect(formatEnvValue('42')).toBe('"42"');
    expect(formatEnvValue('null')).toBe('"null"');
  });

  it('leaves interior spaces unquoted (they survive a round-trip)', () => {
    expect(formatEnvValue('hello world')).toBe('hello world');
  });

  it('quotes strings with edge whitespace or special characters', () => {
    expect(formatEnvValue(' leading')).toBe('" leading"');
    expect(formatEnvValue('a,b')).toBe('"a,b"');
    expect(formatEnvValue('has#hash')).toBe('"has#hash"');
  });

  it('escapes newlines inside quotes', () => {
    expect(formatEnvValue('line1\nline2')).toBe('"line1\\nline2"');
  });
});

describe('parseEnvValueText', () => {
  it('parses unquoted values', () => {
    expect(parseEnvValueText('value')).toEqual({
      value: 'value',
      quoted: false,
    });
    expect(parseEnvValueText('  spaced  ')).toEqual({
      value: 'spaced',
      quoted: false,
    });
  });

  it('parses double-quoted values and unescapes them', () => {
    expect(parseEnvValueText('"quoted"')).toEqual({
      value: 'quoted',
      quoted: true,
    });
    expect(parseEnvValueText('"line1\\nline2"')).toEqual({
      value: 'line1\nline2',
      quoted: true,
    });
  });

  it('treats single quotes as literal', () => {
    expect(parseEnvValueText("'a\\nb'")).toEqual({
      value: 'a\\nb',
      quoted: true,
    });
  });
});
