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

interface GraficaProyectosPorEmpresaProps {
  datos: ProyectosPorEmpresa[];
}

function GraficaProyectosPorEmpresa({ datos }: GraficaProyectosPorEmpresaProps) {
  const datosPreparados = prepararDatosBarras(datos, 10);

  if (datosPreparados.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={datosPreparados} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="nombreEmpresa"
          tickFormatter={(nombre: string) => truncarNombre(nombre, 20)}
          angle={-45}
          textAnchor="end"
          interval={0}
        />
        <YAxis allowDecimals={false} label={{ value: 'Cantidad de proyectos', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          formatter={(value) => [value, 'Proyectos']}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="cantidadProyectos" fill="#3b82f6" name="Proyectos" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaProyectosPorEmpresa;
