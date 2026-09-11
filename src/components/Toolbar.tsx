import type { Format } from '../lib';

export interface UiOptions {
  uppercase: boolean;
  lowercaseKeys: boolean;
  inferTypes: boolean;
  arrays: boolean;
}

interface ToolbarProps {
  from: Format;
  to: Format;
  options: UiOptions;
  canClear: boolean;
  onFrom: (format: Format) => void;
  onTo: (format: Format) => void;
  onOption: <K extends keyof UiOptions>(key: K, value: UiOptions[K]) => void;
  onLoadExample: () => void;
  onClear: () => void;
}

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: 'yaml', label: 'YAML' },
  { value: 'env', label: '.env' },
  { value: 'configmap', label: 'ConfigMap' },
];

interface FormatSelectProps {
  label: string;
  value: Format;
  onChange: (format: Format) => void;
}

function FormatSelect({ label, value, onChange }: FormatSelectProps) {
  return (
    <label className="fmt">
      <span>{label}</span>
      <select
        aria-label={`${label} format`}
        value={value}
        onChange={(event) => onChange(event.target.value as Format)}
      >
        {FORMAT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function Toolbar({
  from,
  to,
  options,
  canClear,
  onFrom,
  onTo,
  onOption,
  onLoadExample,
  onClear,
}: ToolbarProps) {
  const fromFlat = from !== 'yaml';
  const toFlat = to !== 'yaml';

  return (
    <div className="toolbar">
      <div className="fmt-group">
        <FormatSelect label="From" value={from} onChange={onFrom} />
        <span className="fmt-arrow" aria-hidden="true">
          →
        </span>
        <FormatSelect label="To" value={to} onChange={onTo} />
      </div>

      <div className="options">
        {fromFlat ? (
          <Toggle
            label="Infer types"
            checked={options.inferTypes}
            onChange={(v) => onOption('inferTypes', v)}
          />
        ) : null}
        <Toggle
          label="Arrays (CSV)"
          checked={options.arrays}
          onChange={(v) => onOption('arrays', v)}
        />
        {toFlat ? (
          <Toggle
            label="UPPERCASE keys"
            checked={options.uppercase}
            onChange={(v) => onOption('uppercase', v)}
          />
        ) : null}
        {to === 'yaml' && fromFlat ? (
          <Toggle
            label="lowercase keys"
            checked={options.lowercaseKeys}
            onChange={(v) => onOption('lowercaseKeys', v)}
          />
        ) : null}
        <span className="sep-note">
          nesting <code>_</code>
        </span>
      </div>

      <div className="toolbar-spacer" />

      <button type="button" className="btn" onClick={onLoadExample}>
        Load example
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onClear}
        disabled={!canClear}
      >
        Clear
      </button>
    </div>
  );
}
