import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Badge, Card } from '@/components/ui';
import LoginForm from '@/components/LoginForm';

/**
 * LoginPage — точка входа в приложение с дизайном «ops cockpit».
 *
 * Всегда рендерится в тёмной теме (`data-theme="dark"`) и содержит:
 * верхнюю панель статуса, консольную карточку входа и превью панели
 * управления. Если пользователь уже аутентифицирован, он перенаправляется
 * на защищённую главную (Req 7.5).
 */
function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const kpiData = [
    {
      label: 'Empresas activas',
      value: '12',
      delta: '▲ +2 este mes',
      colorVar: '--chart-1',
      points: '0,28 15,24 30,26 45,18 60,20 75,12 90,8 100,5',
    },
    {
      label: 'Proyectos activos',
      value: '47',
      delta: '▲ +8 este mes',
      colorVar: '--chart-2',
      points: '0,26 15,22 30,24 45,16 60,18 75,10 90,12 100,6',
    },
    {
      label: 'Tasa de cumplimiento',
      value: '94%',
      delta: '▲ +3 pp',
      colorVar: '--chart-4',
      points: '0,20 15,18 30,22 45,14 60,12 75,8 90,6 100,4',
    },
  ] as const;

  const barHeights = [45, 65, 50, 80, 70, 90, 60] as const;
  const barOpacities = [0.7, 0.8, 0.7, 1, 0.85, 1, 0.75] as const;

  return (
    <div
      data-theme="dark"
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <header
        className="flex items-center justify-between border-b border-border bg-sidebar px-6 py-4 lg:px-10"
        aria-label="Barra superior"
      >
        <div className="flex items-center gap-2 font-bold text-sidebar-foreground">
          <span
            className="h-2 w-2 rounded-full bg-success"
            aria-hidden="true"
          />
          Kiro Dashboard
        </div>
        <div className="text-xs text-sidebar-muted">
          Sistema operativo —{' '}
          <span className="text-success">Todos los servicios en línea</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6 lg:flex-row lg:gap-10 lg:p-10">
        <section
          className="flex w-full max-w-[380px] flex-col"
          aria-label="Acceso al sistema"
        >
          <Card className="flex flex-1 flex-col p-6 shadow-[var(--shadow-md)] lg:p-8">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
              </div>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                kiro@dashboard:~$ auth
              </span>
            </div>

            <h2 className="mb-1 text-lg font-bold">Autenticación segura</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Verificación de token JWT · Control de acceso
            </p>

            <LoginForm />

            <div className="mt-auto flex justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span>v2.4.1 · .NET 10</span>
              <span>Cifrado · TLS 1.3</span>
            </div>
          </Card>
        </section>

        <section
          className="flex flex-1 flex-col gap-5"
          aria-label="Vista previa del panel"
        >
          <Card className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-bold">Panel de control</h2>
            <Badge tone="success">● En tiempo real</Badge>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {kpiData.map((kpi) => (
              <Card
                key={kpi.label}
                className="relative overflow-hidden p-5"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ backgroundColor: `hsl(var(${kpi.colorVar}))` }}
                  aria-hidden="true"
                />
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </div>
                <div className="my-1 text-3xl font-bold">{kpi.value}</div>
                <div className="text-xs text-success">{kpi.delta}</div>
                <svg
                  className="mt-3"
                  width="100%"
                  height="32"
                  viewBox="0 0 100 32"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={kpi.points}
                    fill="none"
                    stroke={`hsl(var(${kpi.colorVar}))`}
                    strokeWidth="2"
                  />
                </svg>
              </Card>
            ))}
          </div>

          <Card className="flex-1 p-6">
            <h3 className="mb-4 text-sm font-semibold">
              Proyectos por estado — Últimos 7 días
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
              <div
                className="flex h-32 items-end gap-1.5"
                aria-label="Gráfico de barras de proyectos por día"
              >
                {barHeights.map((height, index) => (
                  <div
                    key={index}
                    className="w-full rounded-t-[3px]"
                    style={{
                      height: `${height}%`,
                      backgroundColor: `hsl(var(--chart-1) / ${barOpacities[index]})`,
                    }}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center justify-center">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 42 42"
                  aria-label="Distribución de proyectos por estado"
                >
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="hsl(var(--chart-grid))"
                    strokeWidth="4"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth="4"
                    strokeDasharray="55 45"
                    strokeDashoffset="25"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth="4"
                    strokeDasharray="30 70"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth="4"
                    strokeDasharray="15 85"
                    strokeDashoffset="-30"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: 'hsl(var(--chart-1))' }}
                      aria-hidden="true"
                    />
                    En progreso (55%)
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: 'hsl(var(--chart-2))' }}
                      aria-hidden="true"
                    />
                    Completados (30%)
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: 'hsl(var(--chart-4))' }}
                      aria-hidden="true"
                    />
                    Pendientes (15%)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;