import { useState } from 'react';
import { formatMinutesAsHM, WEEKDAY_NAMES } from '../../core/time';
import { ROLE_MAP } from '../../domain/data/roles';
import { addShift, removeShift, scheduleIssues, weeklyMinutes } from '../../domain/roster';
import { Card, ErrorBox, Field } from '../components';
import { useGame } from '../useGame';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 - 23:00

export function ScheduleScreen() {
  const { state, run } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [weekday, setWeekday] = useState(0);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(15);

  const issues = scheduleIssues(state);

  const submit = () => {
    if (!employeeId) {
      setError('Selecciona un empleado.');
      return;
    }
    setError(run((ctx) => addShift(ctx, employeeId, weekday, startHour * 60, endHour * 60)));
  };

  return (
    <div className="screen">
      <h1>Horarios y turnos</h1>
      <ErrorBox message={error} />

      <Card title="Añadir turno semanal">
        <div className="form-row">
          <Field label="Empleado">
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">— Elegir —</option>
              {state.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({ROLE_MAP[e.role].name})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Día">
            <select value={weekday} onChange={(e) => setWeekday(parseInt(e.target.value))}>
              {WEEKDAY_NAMES.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Inicio">
            <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fin">
            <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))}>
              {HOURS.concat([24]).map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </Field>
          <button className="primary" onClick={submit}>
            Añadir turno
          </button>
        </div>
        <small className="dim">
          La tienda abre de 9:00 a 22:00. Sin cajero en su puesto no hay ventas. Los turnos se
          repiten cada semana.
        </small>
      </Card>

      {issues.length > 0 && (
        <Card title={`Avisos de planificación (${issues.length})`}>
          {issues.map((issue, i) => (
            <p
              key={i}
              style={{ color: issue.severity === 'error' ? 'var(--red)' : 'var(--yellow)' }}
            >
              {issue.severity === 'error' ? '⛔' : '⚠'} {issue.message}
            </p>
          ))}
        </Card>
      )}

      <Card title="Calendario semanal">
        <div className="schedule-grid">
          <div className="head"></div>
          {WEEKDAY_NAMES.map((d) => (
            <div key={d} className="head">
              {d}
            </div>
          ))}
          {state.employees.map((e) => (
            <ScheduleRow key={e.id} employeeId={e.id} onError={setError} />
          ))}
        </div>
        {state.employees.length === 0 && (
          <span className="dim">No hay empleados que planificar.</span>
        )}
      </Card>
    </div>
  );
}

function ScheduleRow(props: { employeeId: string; onError: (e: string | null) => void }) {
  const { state, run } = useGame();
  const emp = state.employees.find((e) => e.id === props.employeeId)!;
  const weekly = weeklyMinutes(state, emp.id) / 60;
  return (
    <>
      <div className="emp-name">
        <div>
          {emp.name}
          <div className="dim" style={{ fontSize: 11 }}>
            {ROLE_MAP[emp.role].name} · {weekly.toFixed(1)}h / {emp.weeklyHours}h
          </div>
        </div>
      </div>
      {Array.from({ length: 7 }, (_, weekday) => {
        const shifts = state.shifts
          .filter((s) => s.employeeId === emp.id && s.weekday === weekday)
          .sort((a, b) => a.startMin - b.startMin);
        return (
          <div key={weekday} className="schedule-cell">
            {shifts.map((s) => (
              <span key={s.id} className="shift-chip">
                {formatMinutesAsHM(s.startMin)}–{formatMinutesAsHM(s.endMin)}
                <button
                  title="Eliminar turno"
                  onClick={() => props.onError(run((ctx) => removeShift(ctx, s.id)))}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
}
