import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { calcularPorcentaje } from '@/utils/dashboardUtils';

interface GraficaEstadoEmpresasProps {
  habilitadas: number;
  deshabilitadas: number;
}

const COLORES = ['#22c55e', '#6b7280'];

function GraficaEstadoEmpresas({ habilitadas, deshabilitadas }: GraficaEstadoEmpresasProps) {
  const total = habilitadas + deshabilitadas;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  const datos = [
    { nombre: 'Habilitadas', valor: habilitadas },
    { nombre: 'Deshabilitadas', valor: deshabilitadas },
  ];

  const renderLabel = (props: PieLabelRenderProps) => {
    const { value, name } = props;
    const porcentaje = calcularPorcentaje(Number(value), total, 1);
    return `${name} ${porcentaje}%`;
  };

  return (
    <PieChart width={400} height={300}>
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
        {datos.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORES[index]} />
        ))}
      </Pie>
      <Tooltip
        formatter={(value) => [`${value}`]}
      />
      <Legend />
    </PieChart>
  );
}

export default GraficaEstadoEmpresas;
