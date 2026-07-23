import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmpresasPage from '../EmpresasPage';
import { empresaService } from '@/services/empresaService';
import type { Empresa } from '@/types/empresa';

vi.mock('@/services/empresaService', () => ({
  empresaService: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockEmpresas: Empresa[] = [
  { id: 1, nombre: 'Empresa A', identificacion: 'NIT-001', direccion: 'Calle 1 #123', telefono: '1234567', estadoHabilitacion: true, createdAt: '2024-01-01', updatedAt: null },
  { id: 2, nombre: 'Empresa B', identificacion: 'NIT-002', direccion: 'Avenida 2 #456', telefono: '7654321', estadoHabilitacion: true, createdAt: '2024-01-02', updatedAt: null },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <EmpresasPage />
    </MemoryRouter>
  );
}

describe('EmpresasPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(empresaService.listar).mockResolvedValue(mockEmpresas);
  });

  describe('Full creation flow', () => {
    it('should create a new empresa: click "Agregar Empresa" → fill fields → click "Guardar" → new empresa appears in table', async () => {
      const user = userEvent.setup();
      const nuevaEmpresa: Empresa = {
        id: 3,
        nombre: 'Empresa Nueva',
        identificacion: 'NIT-003',
        direccion: 'Calle Nueva #789',
        telefono: '9876543',
        estadoHabilitacion: true,
        createdAt: '2024-01-03',
        updatedAt: null,
      };
      vi.mocked(empresaService.crear).mockResolvedValue(nuevaEmpresa);

      renderPage();

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
      });

      // Click "Agregar Empresa" button (it's the one in the header, not the modal title)
      await user.click(screen.getByRole('button', { name: /agregar empresa/i }));

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill fields inside the modal
      const dialog = screen.getByRole('dialog');
      const nombreInput = within(dialog).getByLabelText(/nombre/i);
      const direccionInput = within(dialog).getByLabelText(/dirección/i);
      const telefonoInput = within(dialog).getByLabelText(/teléfono/i);

      await user.type(nombreInput, 'Empresa Nueva');
      await user.type(direccionInput, 'Calle Nueva #789');
      await user.type(telefonoInput, '9876543');

      // Click "Guardar" inside the modal
      const guardarButton = within(dialog).getByRole('button', { name: /guardar/i });
      await user.click(guardarButton);

      // Verify service was called with correct data
      await waitFor(() => {
        expect(empresaService.crear).toHaveBeenCalledWith(
          { nombre: 'Empresa Nueva', direccion: 'Calle Nueva #789', telefono: '9876543' },
          { timeout: 30000 }
        );
      });

      // Verify modal closes and new empresa appears in the table
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Empresa Nueva')).toBeInTheDocument();
      expect(screen.getByText('Calle Nueva #789')).toBeInTheDocument();
    }, 15000);
  });

  describe('Full edit flow', () => {
    it('should edit an existing empresa: click "Editar" → verify fields pre-loaded → modify fields → click "Guardar" → row updated', async () => {
      const user = userEvent.setup();
      const empresaActualizada: Empresa = {
        id: 1,
        nombre: 'Empresa A Modificada',
        identificacion: 'NIT-001',
        direccion: 'Calle Modificada #999',
        telefono: '1111111',
        estadoHabilitacion: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-02-01',
      };
      vi.mocked(empresaService.actualizar).mockResolvedValue(empresaActualizada);

      renderPage();

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
      });

      // Click "Editar" on the first row
      const editButtons = screen.getAllByRole('button', { name: /^editar$/i });
      await user.click(editButtons[0]!);

      // Verify modal opens with "Editar Empresa" title
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Editar Empresa')).toBeInTheDocument();

      // Verify fields are pre-loaded with existing data
      const nombreInput = within(dialog).getByLabelText(/nombre/i) as HTMLInputElement;
      const direccionInput = within(dialog).getByLabelText(/dirección/i) as HTMLInputElement;
      const telefonoInput = within(dialog).getByLabelText(/teléfono/i) as HTMLInputElement;

      expect(nombreInput.value).toBe('Empresa A');
      expect(direccionInput.value).toBe('Calle 1 #123');
      expect(telefonoInput.value).toBe('1234567');

      // Clear and modify fields
      await user.clear(nombreInput);
      await user.type(nombreInput, 'Empresa A Modificada');
      await user.clear(direccionInput);
      await user.type(direccionInput, 'Calle Modificada #999');
      await user.clear(telefonoInput);
      await user.type(telefonoInput, '1111111');

      // Click "Guardar"
      const guardarButton = within(dialog).getByRole('button', { name: /guardar/i });
      await user.click(guardarButton);

      // Verify service was called with correct id and data
      await waitFor(() => {
        expect(empresaService.actualizar).toHaveBeenCalledWith(
          1,
          { nombre: 'Empresa A Modificada', direccion: 'Calle Modificada #999', telefono: '1111111' },
          { timeout: 30000 }
        );
      });

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify the row is updated in the table
      expect(screen.getByText('Empresa A Modificada')).toBeInTheDocument();
      expect(screen.getByText('Calle Modificada #999')).toBeInTheDocument();
    }, 15000);
  });

  describe('Error flow', () => {
    it('should keep modal open with error message when server returns 500 error', async () => {
      const user = userEvent.setup();
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: {} },
        code: 'ERR_BAD_RESPONSE',
      };
      vi.mocked(empresaService.crear).mockRejectedValue(axiosError);

      // We need axios.isAxiosError to recognize our mock error
      const axios = await import('axios');
      const originalIsAxiosError = axios.default.isAxiosError;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (axios.default as any).isAxiosError = (val: unknown): boolean => {
        if (val && typeof val === 'object' && 'isAxiosError' in val) {
          return (val as { isAxiosError: boolean }).isAxiosError;
        }
        return originalIsAxiosError(val);
      };

      renderPage();

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
      });

      // Open modal
      await user.click(screen.getByRole('button', { name: /agregar empresa/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');

      // Fill valid data
      await user.type(within(dialog).getByLabelText(/nombre/i), 'Test Empresa');
      await user.type(within(dialog).getByLabelText(/dirección/i), 'Direccion de prueba');
      await user.type(within(dialog).getByLabelText(/teléfono/i), '1234567');

      // Click "Guardar"
      await user.click(within(dialog).getByRole('button', { name: /guardar/i }));

      // Verify modal stays open with error message
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Ocurrió un error en el servidor. Intente nuevamente.')).toBeInTheDocument();
      });

      // Restore original function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (axios.default as any).isAxiosError = originalIsAxiosError;
    }, 15000);
  });

  describe('Correct service calls', () => {
    it('should call empresaService.crear for new empresa', async () => {
      const user = userEvent.setup();
      const nuevaEmpresa: Empresa = {
        id: 4,
        nombre: 'Empresa Creada',
        identificacion: 'NIT-004',
        direccion: 'Direccion creada',
        telefono: '7777777',
        estadoHabilitacion: true,
        createdAt: '2024-01-04',
        updatedAt: null,
      };
      vi.mocked(empresaService.crear).mockResolvedValue(nuevaEmpresa);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /agregar empresa/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      await user.type(within(dialog).getByLabelText(/nombre/i), 'Empresa Creada');
      await user.type(within(dialog).getByLabelText(/dirección/i), 'Direccion creada');
      await user.type(within(dialog).getByLabelText(/teléfono/i), '7777777');

      await user.click(within(dialog).getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(empresaService.crear).toHaveBeenCalledTimes(1);
        expect(empresaService.actualizar).not.toHaveBeenCalled();
      });
    }, 15000);

    it('should call empresaService.actualizar with correct id for edit', async () => {
      const user = userEvent.setup();
      const empresaActualizada: Empresa = {
        id: 2,
        nombre: 'Empresa B Editada',
        identificacion: 'NIT-002',
        direccion: 'Avenida 2 #456',
        telefono: '7654321',
        estadoHabilitacion: true,
        createdAt: '2024-01-02',
        updatedAt: '2024-02-01',
      };
      vi.mocked(empresaService.actualizar).mockResolvedValue(empresaActualizada);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Empresa B')).toBeInTheDocument();
      });

      // Click "Editar" on second row
      const editButtons = screen.getAllByRole('button', { name: /^editar$/i });
      await user.click(editButtons[1]!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');

      // Modify the name only (other fields should be pre-loaded)
      const nombreInput = within(dialog).getByLabelText(/nombre/i);
      await user.clear(nombreInput);
      await user.type(nombreInput, 'Empresa B Editada');

      await user.click(within(dialog).getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(empresaService.actualizar).toHaveBeenCalledTimes(1);
        expect(empresaService.actualizar).toHaveBeenCalledWith(
          2,
          { nombre: 'Empresa B Editada', direccion: 'Avenida 2 #456', telefono: '7654321' },
          { timeout: 30000 }
        );
        expect(empresaService.crear).not.toHaveBeenCalled();
      });
    }, 15000);
  });
});
