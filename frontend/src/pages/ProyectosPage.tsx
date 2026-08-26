import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { proyectoService } from '@/services/proyectoService';
import type { ProyectoListResponse, ProyectoResponse } from '@/types/proyecto';
import ProyectoFormModal from '@/components/ProyectoFormModal';
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

function ProyectosPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [proyectos, setProyectos] = useState<ProyectoListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Modal state
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [proyectoEditar, setProyectoEditar] = useState<ProyectoListResponse | null>(null);

  // Notification state
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: 'exito' | 'error'; visible: boolean }>({
    mensaje: '',
    tipo: 'exito',
    visible: false,
  });

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; proyectoId: number | null }>({
    isOpen: false,
    proyectoId: null,
  });

  const id = Number(empresaId);

  useEffect(() => {
    if (!empresaId || isNaN(id)) return;
    cargarProyectos();
  }, [empresaId]);

  const cargarProyectos = async () => {
    try {
      setLoading(true);
      const data = await proyectoService.listar(id);
      setProyectos(data);
    } catch {
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const solicitarEliminar = (proyectoId: number) => {
    setConfirmState({ isOpen: true, proyectoId });
  };

  const confirmarEliminar = async () => {
    const proyectoId = confirmState.proyectoId;
    setConfirmState({ isOpen: false, proyectoId: null });
    if (proyectoId === null) return;
    try {
      await proyectoService.eliminar(id, proyectoId);
      setProyectos((prev) => prev.filter((p) => p.id !== proyectoId));
      setNotificacion({ mensaje: 'Proyecto eliminado exitosamente', tipo: 'exito', visible: true });
    } catch {
      setNotificacion({ mensaje: 'Error al eliminar el proyecto', tipo: 'error', visible: true });
    }
  };

  const cancelarEliminar = useCallback(() => {
    setConfirmState({ isOpen: false, proyectoId: null });
  }, []);

  const handleAbrirCrear = () => {
    if (modalAbierto) return;
    setModoModal('crear');
    setProyectoEditar(null);
    setModalAbierto(true);
  };

  const handleAbrirEditar = (proyecto: ProyectoListResponse | null) => {
    if (modalAbierto) return;
    if (!proyecto) {
      setNotificacion({ mensaje: 'No se pudo abrir el formulario de edición: proyecto no encontrado', tipo: 'error', visible: true });
      return;
    }
    setModoModal('editar');
    setProyectoEditar(proyecto);
    setModalAbierto(true);
  };

  const handleCerrarModal = useCallback(() => {
    setModalAbierto(false);
    setProyectoEditar(null);
  }, []);

  const handleCrearExito = useCallback((proyecto: ProyectoResponse) => {
    const nuevoItem: ProyectoListResponse = {
      id: proyecto.id,
      nombre: proyecto.nombre,
      fechaHabilitacion: proyecto.fechaHabilitacion,
      estadoHabilitacion: proyecto.estadoHabilitacion,
    };
    setProyectos((prev) => [...prev, nuevoItem]);
    setNotificacion({ mensaje: 'Proyecto creado exitosamente', tipo: 'exito', visible: true });
    setModalAbierto(false);
    setProyectoEditar(null);
  }, []);

  const handleEditarExito = useCallback((proyecto: ProyectoResponse) => {
    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyecto.id
          ? {
              id: proyecto.id,
              nombre: proyecto.nombre,
              fechaHabilitacion: proyecto.fechaHabilitacion,
              estadoHabilitacion: proyecto.estadoHabilitacion,
            }
          : p
      )
    );
    setNotificacion({ mensaje: 'Proyecto actualizado exitosamente', tipo: 'exito', visible: true });
    setModalAbierto(false);
    setProyectoEditar(null);
  }, []);

  const handleCerrarNotificacion = useCallback(() => {
    setNotificacion((prev) => ({ ...prev, visible: false }));
  }, []);

  if (loading) return <Spinner label="Cargando proyectos" />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <Notificacion
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        visible={notificacion.visible}
        onClose={handleCerrarNotificacion}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            className="mb-1 inline-flex items-center gap-1 bg-transparent p-0 text-sm text-primary hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            onClick={() => navigate('/empresas')}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver a Empresas
          </button>
          <h1 className="text-2xl font-bold text-foreground m-0">Proyectos de Empresa #{empresaId}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={handleAbrirCrear}>
            <FolderPlus size={18} aria-hidden="true" />
            Agregar Proyecto
          </Button>
        </div>
      </div>

      {proyectos.length === 0 ? (
        <EmptyState
          title="No hay proyectos registrados para esta empresa."
          description="Agrega un proyecto para comenzar."
        />
      ) : (
        <TableCard>
          <Table>
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Fecha de Habilitación</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {proyectos.map((proyecto) => (
                <Tr key={proyecto.id}>
                  <Td className="font-medium">{proyecto.nombre}</Td>
                  <Td className="tabular-nums">
                    {new Date(proyecto.fechaHabilitacion + 'T00:00:00').toLocaleDateString('es')}
                  </Td>
                  <Td>
                    <Badge tone={proyecto.estadoHabilitacion ? 'success' : 'danger'}>
                      {proyecto.estadoHabilitacion ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleAbrirEditar(proyecto)}>
                        <Pencil size={16} aria-hidden="true" />
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => solicitarEliminar(proyecto.id)}>
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

      <ProyectoFormModal
        isOpen={modalAbierto}
        modo={modoModal}
        empresaId={id}
        proyectoInicial={proyectoEditar}
        onClose={handleCerrarModal}
        onSuccess={modoModal === 'crear' ? handleCrearExito : handleEditarExito}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title="Eliminar Proyecto"
        message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmarEliminar}
        onCancel={cancelarEliminar}
      />
    </div>
  );
}

export default ProyectosPage;
