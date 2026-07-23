import './DashboardError.css';

interface DashboardErrorProps {
  onRetry: () => void;
  disabled: boolean;
  mensaje: string;
}

function DashboardError({ onRetry, disabled, mensaje }: DashboardErrorProps) {
  return (
    <div className="dashboard-error" role="alert">
      <p className="dashboard-error__mensaje">{mensaje}</p>
      <button
        className="dashboard-error__retry"
        onClick={onRetry}
        disabled={disabled}
        type="button"
      >
        Reintentar
      </button>
      {disabled && (
        <p className="dashboard-error__disabled-msg">
          Por favor, intente de nuevo más tarde.
        </p>
      )}
    </div>
  );
}

export default DashboardError;
