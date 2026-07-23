import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import GraficaProyectosPorEmpresa from '../GraficaProyectosPorEmpresa';
import type { ProyectosPorEmpresa } from '@/types/dashboard';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('GraficaProyectosPorEmpresa', () => {
  const datosMuestra: ProyectosPorEmpresa[] = [
    { nombreEmpresa: 'Empresa Alpha', cantidadProyectos: 10 },
    { nombreEmpresa: 'Empresa Beta', cantidadProyectos: 7 },
    { nombreEmpresa: 'Empresa Gamma', cantidadProyectos: 3 },
  ];

  /**
   * **Validates: Requirements 5.1**
   * Gráfica de barras con cantidad de proyectos por empresa, orden descendente
   */
  describe('Renderizado con datos', () => {
    it('renderiza el componente sin errores cuando hay datos', () => {
      const { container } = render(
        <GraficaProyectosPorEmpresa datos={datosMuestra} />
      );
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });

    it('no muestra mensaje de estado vacío cuando hay datos', () => {
      render(<GraficaProyectosPorEmpresa datos={datosMuestra} />);
      expect(screen.queryByText('No hay datos disponibles')).not.toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirements 5.5**
   * Si no hay empresas con proyectos, mostrar estado vacío
   */
  describe('Estado vacío', () => {
    it('muestra "No hay datos disponibles" cuando el array está vacío', () => {
      render(<GraficaProyectosPorEmpresa datos={[]} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('no renderiza el contenedor de gráfica cuando no hay datos', () => {
      const { container } = render(
        <GraficaProyectosPorEmpresa datos={[]} />
      );
      expect(container.querySelector('.recharts-responsive-container')).not.toBeInTheDocument();
    });
  });
});
