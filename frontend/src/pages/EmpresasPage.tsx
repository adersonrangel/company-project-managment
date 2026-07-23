import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { empresaService } from '@/services/empresaService';
import EmpresaFormModal from '@/components/EmpresaFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Notificacion from '@/components/Notificacion';
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

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  return (
    <div>
      <Notificacion
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        visible={notificacion.visible}
        onClose={cerrarNotificacion}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Empresas</h1>
        <button className="primary" onClick={abrirModalCrear}>
          Agregar Empresa
        </button>
      </div>

      {empresas.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No hay empresas registradas.</p>
      ) : (
        <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td>{empresa.id}</td>
                  <td>{empresa.nombre}</td>
                  <td>{empresa.direccion}</td>
                  <td>{empresa.telefono}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        backgroundColor: empresa.estadoHabilitacion ? 'var(--color-success-bg, #d4edda)' : 'var(--color-danger-bg, #f8d7da)',
                        color: empresa.estadoHabilitacion ? 'var(--color-success-text, #155724)' : 'var(--color-danger-text, #721c24)',
                      }}
                    >
                      {empresa.estadoHabilitacion ? 'Habilitada' : 'Deshabilitada'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="primary"
                      onClick={() => navigate(`/empresas/${empresa.id}/proyectos`)}
                    >
                      Proyectos
                    </button>
                    <button
                      onClick={(e) => abrirModalEditar(empresa, e)}
                    >
                      Editar
                    </button>
                    <button className="danger" onClick={() => solicitarEliminar(empresa.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
