interface OutputPaneProps {
  title: string;
  lang: string;
  value: string;
  placeholder?: string;
  meta?: string;
  error?: boolean;
  copied: boolean;
  onCopy: () => void;
}

export function OutputPane({
  title,
  lang,
  value,
  placeholder,
  meta,
  error = false,
  copied,
  onCopy,
}: OutputPaneProps) {
  const empty = value.length === 0;
  return (
    <section className="pane">
      <div className="pane-header">
        <div className="pane-title">
          {title}
          <span className="lang-tag">{lang}</span>
        </div>
        <div className="pane-actions">
          {meta ? <span className="pane-meta">{meta}</span> : null}
          <button
            type="button"
            className={`btn${copied ? ' copied' : ''}`}
            onClick={onCopy}
            disabled={empty}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre
        className="output"
        data-empty={empty}
        data-error={error}
        aria-label={title}
        tabIndex={0}
      >
        {empty ? placeholder : value}
      </pre>
    </section>
  );
}
