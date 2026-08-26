import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { empresaService } from '@/services/empresaService';
import EmpresaFormModal from '@/components/EmpresaFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Notificacion from '@/components/Notificacion';
import {
  Button,
  Badge,
  TableCard,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  EmptyState,
  Spinner,
} from '@/components/ui';
import type { Empresa } from '@/types/empresa';

interface ModalState {
  isOpen: boolean;
  modo: 'crear' | 'editar';
  empresa: Empresa | null;
}

function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    modo: 'crear',
    empresa: null,
  });
  const navigate = useNavigate();
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; empresaId: number | null }>({
    isOpen: false,
    empresaId: null,
  });

  // Notification state
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: 'exito' | 'error'; visible: boolean }>({
    mensaje: '',
    tipo: 'exito',
    visible: false,
  });

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresaService.listar();
      setEmpresas(data);
    } catch {
      setError('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const solicitarEliminar = (id: number) => {
    setConfirmState({ isOpen: true, empresaId: id });
  };

  const confirmarEliminar = async () => {
    const empresaId = confirmState.empresaId;
    setConfirmState({ isOpen: false, empresaId: null });
    if (empresaId === null) return;
    try {
      await empresaService.eliminar(empresaId);
      setEmpresas((prev) => prev.filter((e) => e.id !== empresaId));
      setNotificacion({ mensaje: 'Empresa eliminada exitosamente', tipo: 'exito', visible: true });
    } catch {
      setNotificacion({ mensaje: 'Error al eliminar la empresa', tipo: 'error', visible: true });
    }
  };

  const cancelarEliminar = useCallback(() => {
    setConfirmState({ isOpen: false, empresaId: null });
  }, []);

  const abrirModalCrear = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerButtonRef.current = e.currentTarget;
    setModalState({ isOpen: true, modo: 'crear', empresa: null });
  };

  const abrirModalEditar = (empresa: Empresa, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerButtonRef.current = e.currentTarget;
    setModalState({ isOpen: true, modo: 'editar', empresa });
  };

  const cerrarModal = () => {
    setModalState({ isOpen: false, modo: 'crear', empresa: null });
  };

  const cerrarNotificacion = useCallback(() => {
    setNotificacion((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleSuccess = (empresa: Empresa) => {
    if (modalState.modo === 'crear') {
      setEmpresas((prev) => [empresa, ...prev]);
      setNotificacion({ mensaje: 'Empresa creada exitosamente', tipo: 'exito', visible: true });
    } else {
      setEmpresas((prev) =>
        prev.map((e) => (e.id === empresa.id ? empresa : e))
      );
      setNotificacion({ mensaje: 'Empresa actualizada exitosamente', tipo: 'exito', visible: true });
    }
  };

  if (loading) return <Spinner label="Cargando empresas" />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <Notificacion
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        visible={notificacion.visible}
        onClose={cerrarNotificacion}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground m-0">Empresas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={abrirModalCrear}>
            <Building2 size={18} aria-hidden="true" />
            Agregar Empresa
          </Button>
        </div>
      </div>

      {empresas.length === 0 ? (
        <EmptyState
          title="No hay empresas registradas."
          description="Crea tu primera empresa para empezar a gestionar sus proyectos."
        />
      ) : (
        <TableCard>
          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Nombre</Th>
                <Th>Dirección</Th>
                <Th>Teléfono</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {empresas.map((empresa) => (
                <Tr key={empresa.id}>
                  <Td className="text-muted-foreground tabular-nums">{empresa.id}</Td>
                  <Td className="font-medium">{empresa.nombre}</Td>
                  <Td>{empresa.direccion}</Td>
                  <Td className="tabular-nums">{empresa.telefono}</Td>
                  <Td>
                    <Badge tone={empresa.estadoHabilitacion ? 'success' : 'danger'}>
                      {empresa.estadoHabilitacion ? 'Habilitada' : 'Deshabilitada'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/empresas/${empresa.id}/proyectos`)}
                      >
                        <FolderKanban size={16} aria-hidden="true" />
                        Proyectos
                      </Button>
                      <Button variant="secondary" size="sm" onClick={(e) => abrirModalEditar(empresa, e)}>
                        <Pencil size={16} aria-hidden="true" />
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => solicitarEliminar(empresa.id)}>
                        <Trash2 size={16} aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableCard>
      )}

      <EmpresaFormModal
        key={modalState.empresa?.id ?? 'crear'}
        isOpen={modalState.isOpen}
        modo={modalState.modo}
        empresaInicial={modalState.empresa}
        onClose={cerrarModal}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title="Eliminar Empresa"
        message="¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmarEliminar}
        onCancel={cancelarEliminar}
      />
    </div>
  );
}

export default EmpresasPage;
