import './DashboardLoading.css';

function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-label="Cargando estadísticas">
      <div className="dashboard-loading__spinner" />
    </div>
  );
}

export default DashboardLoading;
