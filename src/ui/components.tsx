import type { ReactNode } from 'react';

export function Card(props: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="card">
      {(props.title || props.actions) && (
        <div className="card-head">
          {props.title && <h2>{props.title}</h2>}
          {props.actions}
        </div>
      )}
      {props.children}
    </div>
  );
}

export function Stat(props: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'good' | 'bad' | 'warn';
}) {
  return (
    <div className={`stat ${props.tone ?? ''}`}>
      <div className="stat-label">{props.label}</div>
      <div className="stat-value">{props.value}</div>
      {props.sub && <div className="stat-sub">{props.sub}</div>}
    </div>
  );
}

export function Badge(props: { tone?: 'green' | 'red' | 'yellow' | 'blue'; children: ReactNode }) {
  return <span className={`badge ${props.tone ?? ''}`}>{props.children}</span>;
}

export function ErrorBox(props: { message: string | null }) {
  if (!props.message) return null;
  return <div className="error-box">{props.message}</div>;
}

export function Progress(props: { value: number; max: number; tone?: 'green' | 'red' | 'yellow' }) {
  const ratio = props.max > 0 ? Math.min(1, Math.max(0, props.value / props.max)) : 0;
  return (
    <div className={`progress ${props.tone ?? ''}`}>
      <div style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="form-field">
      <label>{props.label}</label>
      {props.children}
    </div>
  );
}
