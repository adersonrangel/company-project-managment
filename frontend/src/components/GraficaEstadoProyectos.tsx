import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { calcularPorcentaje } from '@/utils/dashboardUtils';

interface GraficaEstadoProyectosProps {
  habilitados: number;
  deshabilitados: number;
}

const COLORES = ['#22c55e', '#ef4444'];

function GraficaEstadoProyectos({ habilitados, deshabilitados }: GraficaEstadoProyectosProps) {
  const total = habilitados + deshabilitados;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No hay datos disponibles</p>
      </div>
    );
  }

  const datos = [
    { nombre: 'Habilitados', valor: habilitados },
    { nombre: 'Deshabilitados', valor: deshabilitados },
  ];

  const renderLabel = (props: PieLabelRenderProps) => {
    const valor = props.value as number;
    const nombre = props.name as string;
    const porcentaje = calcularPorcentaje(valor, total, 0);
    return `${nombre} ${porcentaje}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={datos}
          dataKey="valor"
          nameKey="nombre"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label={renderLabel}
        >
          {datos.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORES[index]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}`]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default GraficaEstadoProyectos;
