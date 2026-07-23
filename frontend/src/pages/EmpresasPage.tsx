import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { empresaService } from '@/services/empresaService';
import EmpresaFormModal from '@/components/EmpresaFormModal';
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

  const eliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;
    try {
      await empresaService.eliminar(id);
      setEmpresas((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError('Error al eliminar la empresa');
    }
  };

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

  const handleSuccess = (empresa: Empresa) => {
    if (modalState.modo === 'crear') {
      setEmpresas((prev) => [empresa, ...prev]);
    } else {
      setEmpresas((prev) =>
        prev.map((e) => (e.id === empresa.id ? empresa : e))
      );
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  return (
    <div>
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
                    <button className="danger" onClick={() => eliminar(empresa.id)}>
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
    </div>
  );
}

export default EmpresasPage;
