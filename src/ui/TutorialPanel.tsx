import { useEffect, useState } from "react";
import type { ScreenId } from "../state/gameStore";
import type { GameState } from "../domain/state";
import {
  TUTORIAL_STEPS,
  isStepDone,
  loadProgress,
  saveProgress,
  type TutorialProgress,
} from "../domain/tutorial";
import "./tutorial.css";

export interface TutorialPanelProps {
  state: GameState;
  saveId: string;
  onNavigate?: (screen: ScreenId) => void;
}

export function TutorialPanel({
  state,
  saveId,
  onNavigate,
}: TutorialPanelProps) {
  const [progress, setProgress] = useState<TutorialProgress>(() =>
    loadProgress(saveId),
  );

  useEffect(() => {
    setProgress(loadProgress(saveId));
  }, [saveId]);

  const update = (patch: Partial<TutorialProgress>) => {
    const next = { ...progress, ...patch };
    setProgress(next);
    saveProgress(saveId, next);
  };

  if (progress.dismissed) return null;

  const done = TUTORIAL_STEPS.map((s) =>
    isStepDone(s.id, state, progress.acked),
  );
  const total = TUTORIAL_STEPS.length;
  const count = done.filter(Boolean).length;
  const currentIdx = done.indexOf(false);
  const open = !progress.collapsed;

  return (
    <section className="tut" aria-label="Guía de inicio">
      <div className="tut-head">
        <button
          type="button"
          className="tut-toggle"
          aria-expanded={open}
          aria-controls="tut-list"
          onClick={() => update({ collapsed: open })}
        >
          <span className="tut-title">Primeros pasos</span>
          <span className="tut-count">
            {count} de {total}
          </span>
        </button>
        <button
          type="button"
          className="tut-close"
          onClick={() => update({ dismissed: true })}
        >
          Ocultar guía
        </button>
      </div>
      <div
        className="tut-bar"
        role="progressbar"
        aria-label="Progreso de la guía"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={count}
      >
        <span style={{ width: `${(count / total) * 100}%` }} />
      </div>
      {open && (
        <>
          <ol className="tut-list" id="tut-list">
            {TUTORIAL_STEPS.map((step, i) => (
              <li
                key={step.id}
                className={`tut-step${done[i] ? " done" : ""}${i === currentIdx ? " current" : ""}`}
              >
                <span className="tut-mark" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <div className="tut-name">
                    {step.title}
                    <span className="tut-sr">
                      {done[i] ? " (completado)" : " (pendiente)"}
                    </span>
                  </div>
                  {i === currentIdx && <p className="tut-hint">{step.hint}</p>}
                </div>
                {!done[i] && (
                  <div>
                    {step.manual && isStepDone("day", state, []) ? (
                      <button
                        type="button"
                        className="tut-go"
                        onClick={() =>
                          update({ acked: [...progress.acked, step.id] })
                        }
                      >
                        Marcar leído
                      </button>
                    ) : null}
                    {onNavigate && (
                      <button
                        type="button"
                        className="tut-go"
                        onClick={() => onNavigate(step.target)}
                      >
                        Ir
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {count === total && (
            <p className="tut-done">Listo: ya dominas lo básico.</p>
          )}
        </>
      )}
    </section>
  );
}
