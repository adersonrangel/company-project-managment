import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import GraficaEstadoProyectos from '../GraficaEstadoProyectos';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('GraficaEstadoProyectos', () => {
  /**
   * **Validates: Requirements 4.1**
   * Gráfica circular con 2 segmentos: habilitados y deshabilitados
   */
  describe('Renderizado con datos', () => {
    it('renderiza el componente sin errores cuando hay datos válidos', () => {
      const { container } = render(
        <GraficaEstadoProyectos habilitados={8} deshabilitados={4} />
      );
      // ResponsiveContainer + PieChart genera SVG
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });

    it('no muestra mensaje de estado vacío cuando hay datos', () => {
      render(<GraficaEstadoProyectos habilitados={15} deshabilitados={5} />);
      expect(screen.queryByText('No hay datos disponibles')).not.toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirements 4.4**
   * Si no hay proyectos, mostrar estado vacío con mensaje "No hay datos disponibles"
   */
  describe('Estado vacío', () => {
    it('muestra "No hay datos disponibles" cuando habilitados y deshabilitados son 0', () => {
      render(<GraficaEstadoProyectos habilitados={0} deshabilitados={0} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('no renderiza el contenedor de gráfica cuando no hay datos', () => {
      const { container } = render(
        <GraficaEstadoProyectos habilitados={0} deshabilitados={0} />
      );
      expect(container.querySelector('.recharts-responsive-container')).not.toBeInTheDocument();
    });
  });
});
