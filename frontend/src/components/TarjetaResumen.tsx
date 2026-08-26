import { ReactNode } from 'react';
import { Card } from '@/components/ui';

interface TarjetaResumenProps {
  valor: number;
  etiqueta: string;
  icono?: ReactNode;
}

function TarjetaResumen({ valor, etiqueta, icono }: TarjetaResumenProps) {
  return (
    <Card className="tarjeta-resumen flex items-center gap-4 p-5">
      {icono && (
        <div className="tarjeta-resumen__icono flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary text-xl">
          {icono}
        </div>
      )}
      <div className="tarjeta-resumen__contenido flex flex-col">
        <span className="tarjeta-resumen__valor text-3xl font-bold leading-tight text-foreground tabular-nums">
          {valor}
        </span>
        <span className="tarjeta-resumen__etiqueta text-sm text-muted-foreground">
          {etiqueta}
        </span>
      </div>
    </Card>
  );
}

export default TarjetaResumen;
