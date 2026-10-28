# Supermarket Tycoon

Juego de navegador de gestión empresarial: administra un supermercado desde cero — compras,
precios, inventario, personal, turnos, facturas, préstamos, marketing, eventos y expansión.
La simulación es lo primero; los gráficos son una capa de representación.

## Ejecutar

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests (Vitest)
npm run typecheck  # tsc
npm run build      # build de producción
```

## Stack

TypeScript (strict) · React 19 + Vite · Zustand (puente simulación→UI) · Zod (validación de
partidas guardadas) · Vitest · oxlint + Prettier. Persistencia en `localStorage` con guardado
versionado (`saveVersion`) y punto de migración.

## Arquitectura

Separación estricta en capas con dependencias unidireccionales:

```
ui → state (Zustand) → sim (sistemas) → domain (lógica pura) → core (tiempo, rng)
persistence → domain
```

- `src/core` — reloj de simulación (calendario 360 días, velocidades 0/1/2/5/10x), RNG
  determinista serializable (misma semilla + mismos comandos = mismo resultado).
- `src/domain` — entidades y comandos puros: economía (todo movimiento de dinero pasa por el
  ledger como transacción), facturas con estados y consecuencias (recargo, corte de luz),
  inventario por lotes FIFO con caducidad, pedidos a proveedores, empleados/turnos/nóminas,
  equipamiento, marketing, progresión de nivel y mapa 2D con efectos reales sobre la simulación.
- `src/sim` — sistemas que reaccionan a los hooks del reloj (hora/día/mes): clientes, entregas,
  caducidades, facturación, nóminas, eventos dinámicos y cierre contable.
- `src/ui` — pantallas de gestión (React). No contiene lógica de negocio: lee el estado y
  despacha comandos.

La simulación funciona sin UI (así se testea) y puede ejecutarse a cualquier velocidad sin
depender de `setInterval` por sistema: hay un único driver que alimenta el reloj central.

## Mecánicas principales

- **Tiempo**: apertura 9:00–22:00, entregas a las 8:00, cierre contable a las 23:00, facturas y
  nóminas el día 1 de cada mes.
- **Clientes**: demanda por hora (curva horaria, fin de semana, reputación, marketing, eventos),
  capacidad de caja según cajeros presentes y layout, decisión de compra sensible al precio.
- **Mapa 2D**: la posición importa — estanterías lejos del almacén reponen peor, cajas lejos de
  la puerta gestionan peor las colas, salas saturadas reducen la satisfacción.
- **Consecuencias**: facturas impagadas generan recargo y corte de luz; sin frío se estropea el
  género; plantilla desmotivada renuncia; sin seguridad hay robos.
