import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import GraficaEstadoEmpresas from '../GraficaEstadoEmpresas';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('GraficaEstadoEmpresas', () => {
  /**
   * **Validates: Requirements 3.1**
   * Gráfica circular (donut) con 2 segmentos: habilitadas y deshabilitadas
   */
  describe('Renderizado con datos', () => {
    it('renderiza el componente sin errores cuando hay datos válidos', () => {
      const { container } = render(
        <GraficaEstadoEmpresas habilitadas={5} deshabilitadas={3} />
      );
      // Debe renderizar un SVG (PieChart genera SVG)
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('no muestra mensaje de estado vacío cuando hay datos', () => {
      render(<GraficaEstadoEmpresas habilitadas={10} deshabilitadas={2} />);
      expect(screen.queryByText('No hay datos disponibles')).not.toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirements 3.4**
   * Si total empresas es 0, mostrar estado vacío con mensaje "No hay datos disponibles"
   */
  describe('Estado vacío', () => {
    it('muestra "No hay datos disponibles" cuando habilitadas y deshabilitadas son 0', () => {
      render(<GraficaEstadoEmpresas habilitadas={0} deshabilitadas={0} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('no renderiza SVG cuando no hay datos', () => {
      const { container } = render(
        <GraficaEstadoEmpresas habilitadas={0} deshabilitadas={0} />
      );
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });
});
