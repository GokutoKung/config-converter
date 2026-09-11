export type Format = 'yaml' | 'env' | 'configmap';

export interface ConvertOptions {
  separator: string;
  uppercase: boolean;
  lowercaseKeys: boolean;
  inferTypes: boolean;
  arrays: boolean;
  arrayDelimiter: string;
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  separator: '_',
  uppercase: true,
  lowercaseKeys: true,
  inferTypes: true,
  arrays: true,
  arrayDelimiter: ',',
};

export type IssueLevel = 'error' | 'warning';

export interface Issue {
  level: IssueLevel;
  message: string;
  line?: number;
}

export interface ConversionResult {
  output: string;
  ok: boolean;
  issues: Issue[];
  keyCount: number;
}

export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | { [key: string]: ConfigValue };
