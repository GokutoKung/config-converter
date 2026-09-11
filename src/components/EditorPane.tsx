import type { ReactNode } from 'react';

interface EditorPaneProps {
  title: string;
  lang: string;
  value: string;
  placeholder?: string;
  meta?: string;
  actions?: ReactNode;
  onChange: (value: string) => void;
}

export function EditorPane({
  title,
  lang,
  value,
  placeholder,
  meta,
  actions,
  onChange,
}: EditorPaneProps) {
  return (
    <section className="pane">
      <div className="pane-header">
        <div className="pane-title">
          {title}
          <span className="lang-tag">{lang}</span>
        </div>
        <div className="pane-actions">
          {meta ? <span className="pane-meta">{meta}</span> : null}
          {actions}
        </div>
      </div>
      <textarea
        className="editor"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        value={value}
        placeholder={placeholder}
        aria-label={title}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
