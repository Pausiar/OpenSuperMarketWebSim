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

## Quiebra y fin de partida

- **Descubierto**: si el saldo baja de −1.000 €, el día cuenta como día en deuda. Aparecen avisos
  los días 10 y 20 seguidos en números rojos.
- **Quiebra** (fin de la partida) en cuanto ocurre cualquiera de estas dos cosas:
  30 días seguidos en descubierto, o 3 facturas vencidas sin pagar.
- Al quebrar, la simulación se detiene (velocidad 0) y aparece un diálogo con el resumen
  (días jugados, saldo final, días en deuda, facturas vencidas). Desde ahí puedes empezar una
  nueva partida o volver al menú. La partida queda guardada con su estado final.

## Guía de inicio

Durante la partida, un panel de «Primeros pasos» muestra seis pasos: contratar a un cajero,
hacer un pedido, ajustar un precio, abrir turnos, dejar correr un día y leer el informe. Los
pasos se detectan a partir del estado de la partida; el último se marca a mano. El panel se
puede plegar o ocultar, y esa preferencia se guarda en el navegador de cada partida.

## Capa visual

La tienda en vivo (panel de inicio y pantalla de tienda) es una vista de solo lectura en
`<canvas>` que dibuja el plano 2D y figurantes de ambiente a partir de la instantánea horaria
(`live`). Usa su propio generador de números aleatorios: no altera la simulación ni las
partidas guardadas. Durante un apagón la vista se oscurece y muestra la etiqueta APAGÓN.

## Guardado (versión 2)

- Las partidas se guardan en `localStorage` con `saveVersion: 2`. La versión 2 añade la
  instantánea `live` de la última hora simulada.
- Las partidas v1 se migran automáticamente al cargarlas. Partidas de una versión posterior o
  con datos inválidos no se cargan y el menú muestra el motivo.
- El menú indica la versión de cada partida guardada.
