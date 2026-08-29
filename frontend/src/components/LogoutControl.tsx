import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';

interface LogoutControlProps {
  /**
   * Variante de presentación del Control_Cierre_Sesion.
   * - 'sidebar': se renderiza en el pie de la barra lateral (escritorio, >=1024px).
   * - 'topbar': se renderiza en la barra superior (móvil, <=1023px), siguiendo
   *   el patrón visual de ThemeToggle (solo icono con `aria-label` explícito).
   */
  variant: 'sidebar' | 'topbar';
}

const LOGOUT_LABEL = 'Cerrar sesión';

/**
 * Texto del mensaje de error mostrado cuando el cierre de sesión falla o expira
 * el guardián de 5 s (Req 3.4). Indica que el cierre no se completó e invita al
 * reintento activando de nuevo el `Control_Cierre_Sesion`.
 */
const LOGOUT_ERROR_MESSAGE =
  'No se pudo cerrar la sesión. Inténtalo de nuevo.';

/** Duración máxima del guardián de timeout del cierre de sesión (Req 3.4). */
const LOGOUT_TIMEOUT_MS = 5000;

/** Símbolo interno para distinguir la expiración del guardián de un éxito real. */
const LOGOUT_TIMEOUT = Symbol('logout-timeout');

const logoutIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
    />
  </svg>
);

// Indicador de progreso de cierre de sesión (Req 1.4). Se muestra en lugar del
// icono de logout mientras `isLoggingOut` está activo.
const spinnerIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5 animate-spin"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/**
 * Control_Cierre_Sesion: botón accesible que inicia el flujo de cierre de sesión.
 *
 * Establece la estructura del control, el estado interno del flujo
 * (`isDialogOpen`, `isLoggingOut`, `errorMessage`) y el consumo de los hooks
 * `useAuth` (para `logout`) y `useNavigate` (para la redirección posterior).
 * Incluye la activación con guardas (Task 2.1), la integración del
 * `Dialogo_Confirmacion` (Task 2.2) y la confirmación + ejecución de
 * `performLogout` con guardián de timeout de 5 s y redirección en éxito
 * (Task 3.1) y el manejo de fallo/timeout con mensaje de error accesible y
 * reintento (Task 3.2).
 *
 * Requisitos: 1.1 (texto visible "Cerrar sesión"), 1.4 (deshabilitar +
 * indicador de progreso), 3.1 (invocar `logout` al confirmar), 3.2 (redirigir a
 * `/login` en éxito), 3.3 (cerrar el diálogo antes de redirigir), 3.4 (en
 * fallo/timeout permanecer en la ruta, cerrar el diálogo y mostrar mensaje de
 * error accesible), 4.4 (estado no autenticado consistente; delegado en
 * `AuthContext`), 5.1 (nombre accesible no vacío), 5.2 (indicador de foco
 * visible heredado del `Button`).
 */
function LogoutControl({ variant }: LogoutControlProps) {
  // Estado de UI del flujo de cierre de sesión (efímero, en memoria).
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Infraestructura de autenticación y navegación reutilizada (Req 3.1, 3.2).
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Activación del control (Task 2.1). Enter/Espacio los maneja el botón nativo
  // (Req 5.3), por lo que solo se necesita el manejador de `onClick`.
  const handleActivate = () => {
    // Si ya hay un cierre de sesión en progreso, ignorar la activación adicional
    // sin iniciar un nuevo proceso (Req 1.5).
    if (isLoggingOut) return;
    // Si el `Dialogo_Confirmacion` ya está abierto, no abrir una segunda
    // instancia (Req 2.2).
    if (isDialogOpen) return;
    // En otro caso, abrir el `Dialogo_Confirmacion` (Req 2.1).
    setIsDialogOpen(true);
  };

  // Cancelación del diálogo (Task 2.2). `onCancel` de `ConfirmDialog` mapea el
  // botón Cancelar, la tecla Escape y el clic en el overlay a través de
  // `onOpenChange(false)` de Radix (Req 2.3, 2.4, 5.6): cierra el
  // `Dialogo_Confirmacion` conservando la sesión (sin tocar el JWT del
  // `Almacen_Token_Cliente`, Req 2.5) y manteniendo la ruta actual. Radix
  // devuelve el foco al `Control_Cierre_Sesion` automáticamente (Req 5.6).
  // También se limpia cualquier mensaje de error previo para dejar el control
  // en un estado limpio de cara a un nuevo intento.
  const handleCancel = () => {
    setIsDialogOpen(false);
    setErrorMessage(null);
  };

  // Ejecución del cierre de sesión (Task 3.1). Envuelve la invocación de
  // `logout` del `Contexto_Autenticacion` en un `Promise.race` con un guardián de
  // timeout de 5 s (Req 3.4). Aunque el `logout` real es síncrono y se resuelve
  // de inmediato, el guardián mantiene la robustez si en el futuro `logout` se
  // vuelve asíncrono. En éxito redirige a la `Ruta_Login` con `replace` para no
  // dejar la ruta protegida en el historial (Req 3.1, 3.2).
  //
  // En fallo o expiración del guardián de 5 s (Task 3.2): se restablece
  // `isLoggingOut` a `false` para rehabilitar el control, se fija
  // `errorMessage` con el texto de fallo, no se navega y el `Dialogo_Confirmacion`
  // permanece cerrado; el usuario permanece en la ruta actual y puede reintentar
  // activando de nuevo el control (Req 3.4, 4.4).
  const performLogout = async () => {
    // Promesa que resuelve con el resultado de `logout` (éxito) o rechaza si
    // `logout` propaga (borde defensivo; `tokenStorage.clear()` no lanza).
    const logoutPromise = Promise.resolve().then(() => logout());

    // Guardián de timeout: resuelve con el símbolo `LOGOUT_TIMEOUT` a los 5 s.
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<typeof LOGOUT_TIMEOUT>((resolve) => {
      timeoutId = setTimeout(() => resolve(LOGOUT_TIMEOUT), LOGOUT_TIMEOUT_MS);
    });

    try {
      const outcome = await Promise.race([logoutPromise, timeoutPromise]);

      if (outcome === LOGOUT_TIMEOUT) {
        // Expiró el guardián de 5 s antes de que `logout` finalizara (Req 3.4):
        // rehabilitar el control, mostrar el mensaje de error y permanecer en la
        // ruta actual sin navegar. El diálogo ya está cerrado (Req 3.3).
        setIsLoggingOut(false);
        setErrorMessage(LOGOUT_ERROR_MESSAGE);
        return;
      }

      // Éxito: `logout` finalizó correctamente → redirigir a la `Ruta_Login`
      // (Req 3.1, 3.2).
      navigate('/login', { replace: true });
    } catch {
      // Fallo de `logout` (borde defensivo; `tokenStorage.clear()` no lanza,
      // Req 3.4/4.4): rehabilitar el control, mostrar el mensaje de error y
      // permanecer en la ruta actual sin navegar. El diálogo ya está cerrado
      // (Req 3.3), por lo que el reintento se realiza activando de nuevo el
      // control.
      setIsLoggingOut(false);
      setErrorMessage(LOGOUT_ERROR_MESSAGE);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  // Confirmación del diálogo (Task 3.1). Cierra el `Dialogo_Confirmacion`
  // (Req 3.3), marca el cierre de sesión en progreso para deshabilitar el
  // control y mostrar el indicador de progreso (Req 1.4) y ejecuta
  // `performLogout()`.
  const handleConfirm = () => {
    setIsDialogOpen(false);
    setErrorMessage(null);
    setIsLoggingOut(true);
    void performLogout();
  };

  // Región de error accesible (Task 3.2). Se renderiza solo cuando hay un
  // `errorMessage` (fallo o expiración del guardián de 5 s). `role="alert"` con
  // `aria-live="assertive"` anuncia el fallo a la tecnología de asistencia sin
  // bloquear la interfaz; el control permanece habilitado para permitir el
  // reintento (Req 3.4). Al reintentar o cancelar, `errorMessage` se limpia.
  const errorRegion = errorMessage ? (
    <span role="alert" aria-live="assertive" className="text-sm text-danger">
      {errorMessage}
    </span>
  ) : null;

  // `Dialogo_Confirmacion` de cierre de sesión con labels propios de logout
  // (Task 2.2). Instancia única compartida por ambas variantes. Radix aporta
  // foco atrapado, Escape y clic en overlay como cancelación y retorno de foco;
  // `onOpenChange(false)` mapea a `onCancel` dentro de `ConfirmDialog` (Req 2.4).
  const confirmDialog = (
    <ConfirmDialog
      isOpen={isDialogOpen}
      title={LOGOUT_LABEL}
      message="¿Seguro que quieres cerrar sesión?"
      confirmLabel={LOGOUT_LABEL}
      cancelLabel="Cancelar"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  // Indicador de progreso mostrado mientras el cierre de sesión está en curso
  // (Req 1.4). `aria-busy` refuerza el estado para tecnología de asistencia.
  const controlIcon = isLoggingOut ? spinnerIcon : logoutIcon;

  // Botón del `Control_Cierre_Sesion` según la variante de presentación.
  const control =
    variant === 'topbar' ? (
      // Móvil: solo icono. El texto visible se sustituye por un `aria-label`
      // explícito para garantizar un nombre accesible no vacío (Req 5.1).
      <Button
        variant="ghost"
        size="sm"
        aria-label={LOGOUT_LABEL}
        title={LOGOUT_LABEL}
        aria-expanded={isDialogOpen}
        aria-busy={isLoggingOut}
        disabled={isLoggingOut}
        onClick={handleActivate}
        className="h-9 w-9 px-0"
      >
        {controlIcon}
      </Button>
    ) : (
      // Escritorio: texto visible "Cerrar sesión" (Req 1.1, 5.1).
      <Button
        variant="ghost"
        aria-expanded={isDialogOpen}
        aria-busy={isLoggingOut}
        disabled={isLoggingOut}
        onClick={handleActivate}
        className="w-full justify-start"
      >
        {controlIcon}
        <span>{isLoggingOut ? 'Cerrando sesión…' : LOGOUT_LABEL}</span>
      </Button>
    );

  return (
    <>
      {control}
      {errorRegion}
      {confirmDialog}
    </>
  );
}

export default LogoutControl;
