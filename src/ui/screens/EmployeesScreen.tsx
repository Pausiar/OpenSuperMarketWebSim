import { useState } from 'react';
import { ROLE_MAP } from '../../domain/data/roles';
import { fire, giveRaise, grantVacation, hire } from '../../domain/employees';
import { weeklyMinutes } from '../../domain/roster';
import { Badge, Card, ErrorBox, Progress, Stat } from '../components';
import { money, num } from '../format';
import { useGame } from '../useGame';

export function EmployeesScreen() {
  const { state, run } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [vacationDays, setVacationDays] = useState<Record<string, number>>({});

  const monthlyCost = state.employees.reduce((a, e) => a + e.salaryCents, 0);

  return (
    <div className="screen">
      <h1>Empleados</h1>
      <ErrorBox message={error} />

      <div className="grid cols-3">
        <Stat label="Plantilla" value={num(state.employees.length)} />
        <Stat
          label="Coste salarial mensual"
          value={money(monthlyCost)}
          sub="sin contar horas extra"
        />
        <Stat
          label="Motivación media"
          value={
            state.employees.length
              ? `${Math.round(state.employees.reduce((a, e) => a + e.motivation, 0) / state.employees.length)}/100`
              : '—'
          }
        />
      </div>

      <Card title="Plantilla">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puesto</th>
              <th className="num">Salario/mes</th>
              <th className="num">Contrato</th>
              <th className="num">Asignado</th>
              <th>Motivación</th>
              <th>Fatiga</th>
              <th className="num">Vacac.</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {state.employees.map((e) => {
              const weekly = weeklyMinutes(state, e.id) / 60;
              return (
                <tr key={e.id}>
                  <td>
                    <strong>{e.name}</strong>
                    <div className="dim" style={{ fontSize: 11.5 }}>
                      {e.age} años · exp. {e.experience} · prod. {e.productivity.toFixed(2)}
                    </div>
                  </td>
                  <td>{ROLE_MAP[e.role].name}</td>
                  <td className="num">{money(e.salaryCents)}</td>
                  <td className="num dim">{e.weeklyHours}h</td>
                  <td
                    className="num"
                    style={{ color: weekly > e.weeklyHours ? 'var(--yellow)' : undefined }}
                  >
                    {weekly.toFixed(1)}h
                  </td>
                  <td style={{ minWidth: 70 }}>
                    <Progress
                      value={e.motivation}
                      max={100}
                      tone={e.motivation < 40 ? 'red' : e.motivation > 70 ? 'green' : 'yellow'}
                    />
                  </td>
                  <td style={{ minWidth: 70 }}>
                    <Progress value={e.fatigue} max={100} tone={e.fatigue > 70 ? 'red' : 'green'} />
                  </td>
                  <td className="num">{e.vacationDaysLeft}</td>
                  <td>
                    {e.status === 'active' && <Badge tone="green">Activo</Badge>}
                    {e.status === 'sick' && <Badge tone="red">De baja</Badge>}
                    {e.status === 'vacation' && <Badge tone="blue">Vacaciones</Badge>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        max={e.vacationDaysLeft}
                        style={{ width: 52 }}
                        value={vacationDays[e.id] ?? 3}
                        onChange={(ev) =>
                          setVacationDays({
                            ...vacationDays,
                            [e.id]: parseInt(ev.target.value) || 1,
                          })
                        }
                      />
                      <button
                        className="small"
                        title="Dar vacaciones"
                        onClick={() =>
                          setError(run((ctx) => grantVacation(ctx, e.id, vacationDays[e.id] ?? 3)))
                        }
                      >
                        Vacaciones
                      </button>
                      <button
                        className="small"
                        title="Subida de sueldo del 5% (mejora la motivación)"
                        onClick={() => setError(run((ctx) => giveRaise(ctx, e.id, 5)))}
                      >
                        +5% sueldo
                      </button>
                      <button
                        className="small danger"
                        onClick={() => setError(run((ctx) => fire(ctx, e.id)))}
                      >
                        Despedir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {state.employees.length === 0 && (
              <tr>
                <td colSpan={10} className="dim">
                  Sin empleados. ¡El supermercado no puede funcionar!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Candidatos (se renuevan cada lunes)">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puesto</th>
              <th className="num">Salario pedido</th>
              <th className="num">Horas/semana</th>
              <th className="num">Experiencia</th>
              <th className="num">Productividad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.applicants.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.name}</strong> <span className="dim">({a.age} años)</span>
                </td>
                <td>{ROLE_MAP[a.role].name}</td>
                <td className="num">{money(a.salaryCents)}</td>
                <td className="num">{a.weeklyHours}h</td>
                <td className="num">{a.experience}</td>
                <td className="num">{a.productivity.toFixed(2)}</td>
                <td>
                  <button
                    className="small primary"
                    onClick={() => setError(run((ctx) => hire(ctx, a.id)))}
                  >
                    Contratar
                  </button>
                </td>
              </tr>
            ))}
            {state.applicants.length === 0 && (
              <tr>
                <td colSpan={7} className="dim">
                  No hay candidatos esta semana.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <small className="dim">
          Roles:{' '}
          {Object.values(ROLE_MAP)
            .map((r) => `${r.name} (${r.description.toLowerCase()})`)
            .join(' · ')}
        </small>
      </Card>
    </div>
  );
}
