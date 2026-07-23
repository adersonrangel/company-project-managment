import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProyectosPage from '../ProyectosPage';
import { proyectoService } from '@/services/proyectoService';
import type { ProyectoListResponse, ProyectoResponse } from '@/types/proyecto';

vi.mock('@/services/proyectoService', () => ({
  proyectoService: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    obtenerPorId: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ empresaId: '1' }),
    useNavigate: () => vi.fn(),
  };
});

const mockProyectos: ProyectoListResponse[] = [
  { id: 1, nombre: 'Proyecto Alpha', fechaHabilitacion: '2024-01-15', estadoHabilitacion: true },
  { id: 2, nombre: 'Proyecto Beta', fechaHabilitacion: '2023-06-20', estadoHabilitacion: false },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ProyectosPage />
    </MemoryRouter>
  );
}

describe('ProyectosPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(proyectoService.listar).mockResolvedValue(mockProyectos);
  });

  describe('Shows "Agregar Proyecto" button', () => {
    it('should render the page with the "Agregar Proyecto" button visible', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /agregar proyecto/i })).toBeInTheDocument();
    });
  });

  describe('Opens create modal', () => {
    it('should open modal with title "Agregar Proyecto" and empty fields when clicking the button', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /agregar proyecto/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Agregar Proyecto')).toBeInTheDocument();

      // Verify fields are empty
      const nombreInput = within(dialog).getByLabelText(/nombre/i) as HTMLInputElement;
      const fechaInput = within(dialog).getByLabelText(/fecha de habilitación/i) as HTMLInputElement;

      expect(nombreInput.value).toBe('');
      expect(fechaInput.value).toBe('');
    });
  });

  describe('Create flow', () => {
    it('should create a new proyecto: open modal → fill nombre and fecha → submit → table updated + success notification', async () => {
      const user = userEvent.setup();
      const nuevoProyecto: ProyectoResponse = {
        id: 3,
        nombre: 'Proyecto Nuevo',
        fechaHabilitacion: '2024-06-01',
        estadoHabilitacion: true,
        empresaId: 1,
      };
      vi.mocked(proyectoService.crear).mockResolvedValue(nuevoProyecto);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      // Open create modal
      await user.click(screen.getByRole('button', { name: /agregar proyecto/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');

      // Fill fields
      await user.type(within(dialog).getByLabelText(/nombre/i), 'Proyecto Nuevo');
      await user.type(within(dialog).getByLabelText(/fecha de habilitación/i), '2024-06-01');

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /guardar/i }));

      // Verify service was called
      await waitFor(() => {
        expect(proyectoService.crear).toHaveBeenCalledWith(1, {
          nombre: 'Proyecto Nuevo',
          fechaHabilitacion: '2024-06-01',
          estadoHabilitacion: true,
        });
      });

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify new row in table
      expect(screen.getByText('Proyecto Nuevo')).toBeInTheDocument();

      // Verify success notification
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Proyecto creado exitosamente')).toBeInTheDocument();
    }, 15000);
  });

  describe('Opens edit modal', () => {
    it('should open modal with title "Editar Proyecto" and prefilled data when clicking "Editar"', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      // Click "Editar" on the first row
      const editButtons = screen.getAllByRole('button', { name: /^editar$/i });
      await user.click(editButtons[0]!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Editar Proyecto')).toBeInTheDocument();

      // Verify fields are prefilled
      const nombreInput = within(dialog).getByLabelText(/nombre/i) as HTMLInputElement;
      const fechaInput = within(dialog).getByLabelText(/fecha de habilitación/i) as HTMLInputElement;

      expect(nombreInput.value).toBe('Proyecto Alpha');
      expect(fechaInput.value).toBe('2024-01-15');
    });
  });

  describe('Edit flow', () => {
    it('should edit a proyecto: open edit modal → modify nombre → submit → table updated + success notification', async () => {
      const user = userEvent.setup();
      const proyectoActualizado: ProyectoResponse = {
        id: 1,
        nombre: 'Proyecto Alpha Modificado',
        fechaHabilitacion: '2024-01-15',
        estadoHabilitacion: true,
        empresaId: 1,
      };
      vi.mocked(proyectoService.actualizar).mockResolvedValue(proyectoActualizado);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      // Click "Editar" on the first row
      const editButtons = screen.getAllByRole('button', { name: /^editar$/i });
      await user.click(editButtons[0]!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');

      // Modify nombre
      const nombreInput = within(dialog).getByLabelText(/nombre/i);
      await user.clear(nombreInput);
      await user.type(nombreInput, 'Proyecto Alpha Modificado');

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /guardar/i }));

      // Verify service was called
      await waitFor(() => {
        expect(proyectoService.actualizar).toHaveBeenCalledWith(1, 1, {
          nombre: 'Proyecto Alpha Modificado',
          fechaHabilitacion: '2024-01-15',
          estadoHabilitacion: true,
        });
      });

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify the row is updated in the table
      expect(screen.getByText('Proyecto Alpha Modificado')).toBeInTheDocument();

      // Verify success notification
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Proyecto actualizado exitosamente')).toBeInTheDocument();
    }, 15000);
  });

  describe('Does not open second modal', () => {
    it('should not open a second modal if one is already open', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      // Open the create modal
      await user.click(screen.getByRole('button', { name: /agregar proyecto/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to click "Agregar Proyecto" again
      await user.click(screen.getByRole('button', { name: /agregar proyecto/i }));

      // There should still be only one modal
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(1);
    });
  });

  describe('Delete shows notification', () => {
    it('should delete a proyecto: click "Eliminar" → confirm → row removed + success notification', async () => {
      const user = userEvent.setup();
      vi.mocked(proyectoService.eliminar).mockResolvedValue(undefined);

      // Mock window.confirm to return true
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
      });

      // Click "Eliminar" on the first row
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      await user.click(deleteButtons[0]!);

      // Verify confirm was called
      expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de eliminar este proyecto?');

      // Verify service was called
      await waitFor(() => {
        expect(proyectoService.eliminar).toHaveBeenCalledWith(1, 1);
      });

      // Verify row is removed
      await waitFor(() => {
        expect(screen.queryByText('Proyecto Alpha')).not.toBeInTheDocument();
      });

      // Verify Proyecto Beta is still there
      expect(screen.getByText('Proyecto Beta')).toBeInTheDocument();

      // Verify success notification
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Proyecto eliminado exitosamente')).toBeInTheDocument();

      confirmSpy.mockRestore();
    }, 15000);
  });
});
