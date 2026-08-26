import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { ProyectosPorEmpresa } from '@/types/dashboard';
import { prepararDatosBarras, truncarNombre } from '@/utils/dashboardUtils';
import { getChartColors } from '@/utils/chartTheme';

interface GraficaProyectosPorEmpresaProps {
  datos: ProyectosPorEmpresa[];
}

function GraficaProyectosPorEmpresa({ datos }: GraficaProyectosPorEmpresaProps) {
  const datosPreparados = prepararDatosBarras(datos, 10);
  const colores = getChartColors();

  if (datosPreparados.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: colores.mutedForeground }}>
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={datosPreparados} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colores.grid} />
        <XAxis
          dataKey="nombreEmpresa"
          tickFormatter={(nombre: string) => truncarNombre(nombre, 20)}
          angle={-45}
          textAnchor="end"
          interval={0}
          tick={{ fill: colores.mutedForeground }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: colores.mutedForeground }}
          label={{ value: 'Cantidad de proyectos', angle: -90, position: 'insideLeft', fill: colores.mutedForeground }}
        />
        <Tooltip
          formatter={(value) => [value, 'Proyectos']}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="cantidadProyectos" fill={colores.chart1} name="Proyectos" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaProyectosPorEmpresa;
