import { useEffect, useRef, type ReactNode } from 'react';
import type { Severity } from '../domain/state';

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

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal(props: {
  titleId: string;
  descId?: string;
  role?: 'dialog' | 'alertdialog';
  /** Si se omite, Escape no cierra el diálogo (decisión obligatoria del jugador). */
  onClose?: () => void;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(props.onClose);
  useEffect(() => {
    onCloseRef.current = props.onClose;
  }, [props.onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    const initial =
      box?.querySelector<HTMLElement>('[data-autofocus]') ??
      box?.querySelector<HTMLElement>(FOCUSABLE);
    initial?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !box) return;
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      const outside = !active || !box.contains(active);
      if (e.shiftKey && (outside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="modal-backdrop">
      <div
        ref={boxRef}
        className="modal"
        role={props.role ?? 'dialog'}
        aria-modal="true"
        aria-labelledby={props.titleId}
        aria-describedby={props.descId}
      >
        {props.children}
      </div>
    </div>
  );
}

export interface ToastItem {
  id: string;
  severity: Severity;
  message: string;
}

export function Toast(props: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  durationMs?: number;
}) {
  const { id } = props.item;
  const { onDismiss, durationMs = 6000 } = props;
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), durationMs);
    return () => clearTimeout(timer);
  }, [id, onDismiss, durationMs]);

  return (
    <div className={`toast ${props.item.severity}`}>
      <span className="toast-msg">{props.item.message}</span>
      <button
        type="button"
        className="toast-close"
        aria-label="Cerrar aviso"
        onClick={() => onDismiss(id)}
      >
        ×
      </button>
    </div>
  );
}

/** Pila de avisos: anuncia cada aviso nuevo a lectores de pantalla sin robar el foco. */
export function ToastStack(props: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
      {props.items.map((item) => (
        <Toast key={item.id} item={item} onDismiss={props.onDismiss} />
      ))}
    </div>
  );
}
