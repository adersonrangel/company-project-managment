import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { empresaService } from '@/services/empresaService';
import type { Empresa } from '@/types/empresa';

function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Empresas</h1>
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
    </div>
  );
}

export default EmpresasPage;
