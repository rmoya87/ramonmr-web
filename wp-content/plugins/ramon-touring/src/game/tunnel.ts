/** Tunnels sit at fixed road distances so rendering and exit placement agree. */
export const TUNNEL = {
  period: 1900,
  offset: 1000,
  length: 210,
  /** Keep exits (fork + ramp) out of a tunnel and its approach. */
  clearBefore: 130,
  clearAfter: 400,
} as const;

export function tunnelStart(k: number): number {
  return TUNNEL.offset + k * TUNNEL.period;
}

/** 0 = open road, 1 = fully inside; smooth over the portal so light eases. */
export function tunnelAmount(world: number): number {
  const k = Math.round((world - TUNNEL.offset - TUNNEL.length / 2) / TUNNEL.period);
  if (k < 0) return 0;
  const a = tunnelStart(k);
  const b = a + TUNNEL.length;
  const edge = 14;
  if (world <= a - edge || world >= b + edge) return 0;
  if (world < a) return (world - (a - edge)) / edge;
  if (world > b) return 1 - (world - b) / edge;
  return 1;
}

/** Push a planned fork out of any tunnel window (plus approach and exit lanes). */
export function safeFork(fork: number): number {
  let f = fork;
  for (let guard = 0; guard < 4; guard++) {
    const k = Math.round((f - TUNNEL.offset - TUNNEL.length / 2) / TUNNEL.period);
    let moved = false;
    for (const kk of [k - 1, k, k + 1]) {
      if (kk < 0) continue;
      const a = tunnelStart(kk) - TUNNEL.clearBefore;
      const b = tunnelStart(kk) + TUNNEL.length + TUNNEL.clearAfter;
      if (f > a && f < b) {
        f = b;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return f;
}
