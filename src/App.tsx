import { useMemo, useState } from 'react';
import {
  convert,
  SAMPLE_CONFIGMAP,
  SAMPLE_ENV,
  SAMPLE_YAML,
  type Format,
} from './lib';
import { Toolbar, type UiOptions } from './components/Toolbar';
import { EditorPane } from './components/EditorPane';
import { OutputPane } from './components/OutputPane';
import { IssuePanel } from './components/IssuePanel';
import { useCopy } from './hooks/useCopy';

const DEFAULT_UI_OPTIONS: UiOptions = {
  uppercase: true,
  lowercaseKeys: true,
  inferTypes: true,
  arrays: true,
};

const SAMPLES: Record<Format, string> = {
  yaml: SAMPLE_YAML,
  env: SAMPLE_ENV,
  configmap: SAMPLE_CONFIGMAP,
};

const PLACEHOLDER: Record<Format, string> = {
  yaml: 'Paste YAML here…\n\napp:\n  port: 8080\n  debug: true',
  env: 'Paste .env here…\n\nAPP_PORT=8080\nAPP_DEBUG=true',
  configmap:
    'Paste ConfigMap data here…\n\nAPP_PORT: "8080"\nAPP_DEBUG: "true"',
};

const FORMAT_TAG: Record<Format, string> = {
  yaml: 'YAML',
  env: 'ENV',
  configmap: 'ConfigMap',
};

function countLines(text: string): number {
  return text === '' ? 0 : text.split('\n').length;
}

export default function App() {
  const [from, setFrom] = useState<Format>('yaml');
  const [to, setTo] = useState<Format>('env');
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<UiOptions>(DEFAULT_UI_OPTIONS);
  const { copied, copy } = useCopy();

  const result = useMemo(
    () => convert(input, from, to, options),
    [input, from, to, options],
  );

  const setOption = <K extends keyof UiOptions>(key: K, value: UiOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const handleSwap = () => {
    if (result.ok && result.output) setInput(result.output);
    setFrom(to);
    setTo(from);
  };

  const handleLoadExample = () => setInput(SAMPLES[from]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
          />
          <div>
            <h1>Config Converter</h1>
            <p>
              Convert between YAML, .env and Kubernetes ConfigMap — in your
              browser.
            </p>
          </div>
        </div>
        <span className="badge" title="No upload, no backend, no database">
          🔒 100% in-browser
        </span>
      </header>

      <Toolbar
        from={from}
        to={to}
        options={options}
        canClear={input.length > 0}
        onFrom={setFrom}
        onTo={setTo}
        onOption={setOption}
        onLoadExample={handleLoadExample}
        onClear={() => setInput('')}
      />

      <div className="panels">
        <EditorPane
          title="Input"
          lang={FORMAT_TAG[from]}
          value={input}
          placeholder={PLACEHOLDER[from]}
          meta={`${countLines(input)} lines`}
          onChange={setInput}
        />

        <div className="swap-col">
          <button
            type="button"
            className="swap"
            onClick={handleSwap}
            title="Swap From / To"
            aria-label="Swap From and To formats and move output into input"
          >
            <SwapIcon />
          </button>
        </div>

        <OutputPane
          title="Output"
          lang={FORMAT_TAG[to]}
          value={result.output}
          placeholder={`Converted ${FORMAT_TAG[to]} appears here…`}
          meta={result.keyCount > 0 ? `${result.keyCount} keys` : undefined}
          error={!result.ok}
          copied={copied}
          onCopy={() => void copy(result.output)}
        />
      </div>

      <IssuePanel issues={result.issues} />

      <footer className="footer">
        <span>
          <strong>Privacy first.</strong> Everything runs locally — nothing is
          uploaded, no backend, no database.
        </span>
        <span>
          Nesting via single underscore · arrays as comma-separated CSV.
        </span>
      </footer>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
