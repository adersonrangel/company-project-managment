import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor_Solicitud: adjunta la cabecera `Authorization` con el esquema
// `Bearer` cuando existe un JWT almacenado; en ausencia de token, la solicitud
// se envía sin cabecera `Authorization` (Req 5.3, 5.4).
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/**
 * Ruta de inicio de sesión a la que se redirige tras un 401.
 */
const LOGIN_PATH = '/login';

/**
 * Ventana máxima (ms) dentro de la cual debe ocurrir la redirección a `/login`
 * tras recibir una respuesta 401 (Req 6.2). Debe ser <= 2000 ms.
 */
const REDIRECT_DELAY_MS = 0;

/**
 * Bandera de módulo para DEDUPLICAR el manejo de múltiples respuestas HTTP 401
 * concurrentes: la limpieza del token y la redirección a `/login` se ejecutan
 * EXACTAMENTE UNA VEZ aunque lleguen n>=1 respuestas 401 en paralelo (Req 6.5).
 */
let isHandling401 = false;

/**
 * Reinicia la bandera de deduplicación de 401.
 *
 * Export nuevo (helper de testabilidad): permite que las pruebas restablezcan
 * el estado del módulo entre casos para poder verificar el comportamiento de
 * deduplicación de forma aislada. No forma parte del flujo de producción.
 */
export function resetAuthRedirectState(): void {
  isHandling401 = false;
}

/**
 * Ejecuta la transición a estado no autenticado tras un 401: elimina el JWT y
 * los datos de sesión asociados (Req 6.1) y programa la redirección a la ruta
 * de inicio de sesión dentro de 2 s (Req 6.2). Si `tokenStorage.clear()` lanza,
 * se captura el error y se FUERZA igualmente la redirección al estado no
 * autenticado (Req 6.3). La navegación se realiza mediante `window.location`
 * porque el interceptor se ejecuta fuera del árbol de componentes de React,
 * donde `useNavigate` de react-router no está disponible.
 */
function handleUnauthorized(): void {
  try {
    tokenStorage.clear();
  } catch {
    // Req 6.3: aunque la limpieza falle, se fuerza el estado no autenticado y
    // la redirección; ignorar el error de `clear()`.
  }
  setTimeout(() => {
    window.location.href = LOGIN_PATH;
  }, REDIRECT_DELAY_MS);
}

// Interceptor_Respuesta: manejo de errores y respuestas no autorizadas.
//
// Ante una respuesta HTTP 401, ejecuta la limpieza de sesión y la redirección
// a `/login` una sola vez (deduplicado por `isHandling401`) y rechaza las
// promesas de las solicitudes en curso para que su resultado no se aplique al
// estado de la aplicación (Req 6.1-6.5). Se conserva el logging de errores
// existente para el resto de respuestas de error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Deduplicación: la limpieza + redirección se disparan una única vez
      // aunque lleguen múltiples 401 concurrentes (Req 6.5).
      if (!isHandling401) {
        isHandling401 = true;
        handleUnauthorized();
      }
      // Req 6.4: rechazar la promesa de cada solicitud en curso para descartar
      // su resultado sin aplicarlo al estado.
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'Ocurrió un error inesperado';
    console.error('[API Error]', message);
    return Promise.reject(error);
  }
);

export default api;
