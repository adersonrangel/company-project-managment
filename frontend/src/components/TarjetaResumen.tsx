import { ReactNode } from 'react';
import './TarjetaResumen.css';

interface TarjetaResumenProps {
  valor: number;
  etiqueta: string;
  icono?: ReactNode;
}

function TarjetaResumen({ valor, etiqueta, icono }: TarjetaResumenProps) {
  return (
    <div className="tarjeta-resumen">
      {icono && <div className="tarjeta-resumen__icono">{icono}</div>}
      <div className="tarjeta-resumen__contenido">
        <span className="tarjeta-resumen__valor">{valor}</span>
        <span className="tarjeta-resumen__etiqueta">{etiqueta}</span>
      </div>
    </div>
  );
}

export default TarjetaResumen;
