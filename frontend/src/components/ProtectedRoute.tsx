import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '@/utils/tokenStorage';

/** Ruta pública de inicio de sesión a la que se redirige cuando no hay una
 * sesión válida (Req 7.1, 7.3). */
const LOGIN_PATH = '/login';

/**
 * Determina si un JWT está expirado inspeccionando su claim `exp`.
 *
 * El token se considera inválido (y por tanto se trata como expirado) cuando:
 * - no tiene la estructura de tres segmentos separados por puntos,
 * - el payload no puede decodificarse como Base64URL/JSON,
 * - carece de un `exp` numérico, o
 * - su `exp` (en segundos) es anterior o igual al instante actual.
 *
 * Se decodifica localmente sin verificar la firma: la verificación de firma es
 * responsabilidad del backend (Middleware_Autorizacion). Aquí solo se detecta
 * un token claramente inválido o expirado para no renderizar contenido
 * protegido con una sesión inservible (Req 7.3).
 *
 * @param token JWT almacenado en crudo.
 * @returns `true` si el token es inválido o su expiración ya pasó.
 */
function isTokenExpired(token: string): boolean {
  const parts = token.split('.');
  const encodedPayload = parts[1];
  if (parts.length !== 3 || encodedPayload === undefined) {
    return true;
  }

  try {
    // Convertir Base64URL a Base64 estándar antes de decodificar.
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: unknown };

    if (typeof payload.exp !== 'number') {
      return true;
    }

    // `exp` está en segundos desde época; compararlo con el instante actual.
    const nowSeconds = Date.now() / 1000;
    return payload.exp <= nowSeconds;
  } catch {
    // Payload no decodificable → token inválido.
    return true;
  }
}

/**
 * Guardia_Ruta: restringe el acceso a las rutas protegidas según la presencia
 * y validez del JWT en el `Almacen_Token_Cliente`.
 *
 * Comportamiento:
 * - Sin token almacenado → redirige a `/login` sin renderizar el contenido
 *   protegido (Req 7.1).
 * - Con un token válido y no expirado → renderiza las rutas hijas mediante
 *   `<Outlet />` (Req 7.2).
 * - Con un token inválido o expirado → elimina el token (`clear()`) y redirige
 *   a `/login` sin renderizar el contenido protegido (Req 7.3).
 */
export default function ProtectedRoute() {
  const token = tokenStorage.get();

  // Sin token: acceso denegado, redirigir sin renderizar hijos (Req 7.1).
  if (token === null || token === '') {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  // Token presente pero inválido/expirado: limpiar la sesión y redirigir
  // sin renderizar el contenido protegido (Req 7.3).
  if (isTokenExpired(token)) {
    tokenStorage.clear();
    return <Navigate to={LOGIN_PATH} replace />;
  }

  // Token válido: permitir el acceso a las rutas protegidas (Req 7.2).
  return <Outlet />;
}
