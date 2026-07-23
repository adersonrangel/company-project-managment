// Feature: dashboard-estadisticas, Property 6: Renderizado de TarjetaResumen
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import TarjetaResumen from '../TarjetaResumen';

describe('TarjetaResumen', () => {
  /**
   * **Validates: Requirements 2.5, 2.7**
   *
   * Property 6: Para cualquier número entero no negativo y cualquier etiqueta no vacía,
   * el componente TarjetaResumen SHALL renderizar el valor numérico como texto
   * y la etiqueta descriptiva como texto visible en el DOM.
   */
  describe('Property 6: Renderizado de TarjetaResumen', () => {
    it('renders valor numérico y etiqueta como texto visible para cualquier entrada válida', () => {
      fc.assert(
        fc.property(
          fc.nat(), // número entero no negativo
          fc.stringMatching(/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]{1,50}$/).filter((s) => s.trim().length > 0), // etiqueta no vacía con caracteres legibles
          (valor, etiqueta) => {
            const { unmount, container } = render(
              <TarjetaResumen valor={valor} etiqueta={etiqueta} />
            );

            // Verificar que el valor numérico se renderiza como texto visible
            const valorEl = container.querySelector('.tarjeta-resumen__valor');
            expect(valorEl).not.toBeNull();
            expect(valorEl!.textContent).toBe(String(valor));

            // Verificar que la etiqueta se renderiza como texto visible
            const etiquetaEl = container.querySelector('.tarjeta-resumen__etiqueta');
            expect(etiquetaEl).not.toBeNull();
            expect(etiquetaEl!.textContent).toBe(etiqueta);

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Caso específico: Req 2.7 — valor cero debe mostrarse junto a su etiqueta
    it('muestra el valor "0" junto a su etiqueta descriptiva cuando el valor es cero', () => {
      render(<TarjetaResumen valor={0} etiqueta="Proyectos activos" />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Proyectos activos')).toBeInTheDocument();
    });
  });
});
