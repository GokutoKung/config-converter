import { describe, it, expect } from 'vitest';
import { convert } from './convert';

describe('convert facade', () => {
  it('converts yaml -> env', () => {
    expect(convert('a:\n  b: 1', 'yaml', 'env').output).toBe('A_B=1');
  });

  it('converts env -> yaml', () => {
    expect(convert('A_B=1', 'env', 'yaml').output).toBe('a:\n  b: 1');
  });

  it('converts yaml -> configmap', () => {
    expect(convert('a:\n  b: 1', 'yaml', 'configmap').output).toBe('A_B: "1"');
  });

  it('converts env -> configmap', () => {
    expect(convert('A_B=1', 'env', 'configmap').output).toBe('A_B: "1"');
  });

  it('converts configmap -> env', () => {
    expect(convert('A_B: "1"', 'configmap', 'env').output).toBe('A_B=1');
  });

  it('reformats within the same format', () => {
    expect(convert('A=1', 'env', 'env').output).toBe('A=1');
  });

  it('merges partial options over the defaults', () => {
    expect(
      convert('A_B=1', 'env', 'yaml', { lowercaseKeys: false }).output,
    ).toBe('A:\n  B: 1');
  });
});
