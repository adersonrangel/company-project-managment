/**
 * Lee los colores de datos definidos como CSS custom properties (--chart-*)
 * para que las gráficas Recharts respeten el tema claro/oscuro activo.
 *
 * Recharts necesita valores de color concretos (no `var(...)`) en algunas
 * props (p. ej. `fill` de <Cell>), por eso resolvemos el valor HSL en runtime.
 */
function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `hsl(${raw})` : fallback;
}

export function getChartColors() {
  return {
    chart1: readVar('--chart-1', 'hsl(243 75% 59%)'),
    chart2: readVar('--chart-2', 'hsl(142 71% 45%)'),
    chart3: readVar('--chart-3', 'hsl(215 16% 55%)'),
    chart4: readVar('--chart-4', 'hsl(38 92% 50%)'),
    grid: readVar('--chart-grid', 'hsl(214 32% 91%)'),
    mutedForeground: readVar('--muted-foreground', 'hsl(215 16% 47%)'),
  };
}
