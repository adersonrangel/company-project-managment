import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proyectoService } from '@/services/proyectoService';
import type { Proyecto } from '@/types/proyecto';

function ProyectosPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const eliminar = async (proyectoId: number) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
    try {
      await proyectoService.eliminar(id, proyectoId);
      setProyectos((prev) => prev.filter((p) => p.id !== proyectoId));
    } catch {
      setError('Error al eliminar el proyecto');
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button
            onClick={() => navigate('/empresas')}
            style={{ background: 'none', color: 'var(--color-primary)', padding: 0, fontSize: '0.875rem', marginBottom: '0.5rem' }}
          >
            ← Volver a Empresas
          </button>
          <h1>Proyectos de Empresa #{empresaId}</h1>
        </div>
      </div>

      {proyectos.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No hay proyectos registrados para esta empresa.</p>
      ) : (
        <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((proyecto) => (
                <tr key={proyecto.id}>
                  <td>{proyecto.id}</td>
                  <td>{proyecto.nombre}</td>
                  <td>{proyecto.descripcion}</td>
                  <td>{new Date(proyecto.fechaInicio).toLocaleDateString('es')}</td>
                  <td>{proyecto.fechaFin ? new Date(proyecto.fechaFin).toLocaleDateString('es') : '—'}</td>
                  <td>
                    <button className="danger" onClick={() => eliminar(proyecto.id)}>
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

export default ProyectosPage;
