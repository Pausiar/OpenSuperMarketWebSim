// RNG determinista (mulberry32). El estado interno se serializa en la partida
// para que la simulación sea reproducible: mismo seed + mismos comandos = mismo resultado.

export class Rng {
  private s: number;

  constructor(state: number) {
    this.s = state >>> 0;
  }

  /** Estado serializable actual. */
  get state(): number {
    return this.s;
  }

  /** Número en [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Número en [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Entero en [min, max] (ambos inclusive). */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Multiplica base por un factor aleatorio en [1-spread, 1+spread]. */
  jitter(base: number, spread: number): number {
    return base * this.range(1 - spread, 1 + spread);
  }

  /** Elige un índice según pesos. */
  weighted(weights: readonly number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
}
