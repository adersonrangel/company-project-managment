import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proyectoService } from '@/services/proyectoService';
import type { ProyectoListResponse, ProyectoResponse } from '@/types/proyecto';
import ProyectoFormModal from '@/components/ProyectoFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Notificacion from '@/components/Notificacion';

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

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  return (
    <div>
      <Notificacion
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        visible={notificacion.visible}
        onClose={handleCerrarNotificacion}
      />

      <div className="page-toolbar">
        <div>
          <button className="page-back" onClick={() => navigate('/empresas')}>
            ← Volver a Empresas
          </button>
          <h1 className="page-toolbar__title">Proyectos de Empresa #{empresaId}</h1>
        </div>
        <div className="page-toolbar__actions">
          <button className="primary" onClick={handleAbrirCrear}>
            Agregar Proyecto
          </button>
        </div>
      </div>

      {proyectos.length === 0 ? (
        <p className="empty-state">No hay proyectos registrados para esta empresa.</p>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha de Habilitación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((proyecto) => (
                <tr key={proyecto.id}>
                  <td>{proyecto.nombre}</td>
                  <td>{new Date(proyecto.fechaHabilitacion + 'T00:00:00').toLocaleDateString('es')}</td>
                  <td>
                    <span className={`badge ${proyecto.estadoHabilitacion ? 'badge--on' : 'badge--off'}`}>
                      {proyecto.estadoHabilitacion ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => handleAbrirEditar(proyecto)}>
                        Editar
                      </button>
                      <button className="danger" onClick={() => solicitarEliminar(proyecto.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
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
