import type { Issue } from '../lib';

export function IssuePanel({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="issues" role="status" aria-live="polite">
      {issues.map((issue, index) => (
        <div key={index} className={`issue issue-${issue.level}`}>
          <span className="issue-icon" aria-hidden="true">
            {issue.level === 'error' ? '✕' : '!'}
          </span>
          <span className="issue-text">{issue.message}</span>
          {issue.line != null ? (
            <span className="issue-line">line {issue.line}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
