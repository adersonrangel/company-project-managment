import { useDashboard } from '@/hooks/useDashboard';
import DashboardLoading from '@/components/DashboardLoading';
import DashboardError from '@/components/DashboardError';
import TarjetaResumen from '@/components/TarjetaResumen';
import GraficaEstadoEmpresas from '@/components/GraficaEstadoEmpresas';
import GraficaEstadoProyectos from '@/components/GraficaEstadoProyectos';
import GraficaProyectosPorEmpresa from '@/components/GraficaProyectosPorEmpresa';
import './HomePage.css';

function HomePage() {
  const { data, loading, error, retry, maxRetriesReached } = useDashboard();

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <DashboardError
        onRetry={retry}
        disabled={maxRetriesReached}
        mensaje={error}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard__titulo">Dashboard de Estadísticas</h1>

      <section className="dashboard__tarjetas">
        <TarjetaResumen valor={data.totalEmpresas} etiqueta="Total Empresas" />
        <TarjetaResumen valor={data.totalProyectos} etiqueta="Total Proyectos" />
        <TarjetaResumen valor={data.empresasHabilitadas} etiqueta="Empresas Habilitadas" />
        <TarjetaResumen valor={data.proyectosHabilitados} etiqueta="Proyectos Habilitados" />
      </section>

      <section className="dashboard__graficas">
        <div className="dashboard__grafica">
          <GraficaEstadoEmpresas
            habilitadas={data.empresasHabilitadas}
            deshabilitadas={data.empresasDeshabilitadas}
          />
        </div>
        <div className="dashboard__grafica">
          <GraficaEstadoProyectos
            habilitados={data.proyectosHabilitados}
            deshabilitados={data.proyectosDeshabilitados}
          />
        </div>
        <div className="dashboard__grafica dashboard__grafica--full">
          <GraficaProyectosPorEmpresa datos={data.proyectosPorEmpresa} />
        </div>
      </section>
    </div>
  );
}

export default HomePage;
