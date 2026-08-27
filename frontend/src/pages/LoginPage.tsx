import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';
import { loginSchema } from '@/schemas/loginSchema';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '@/components/ui';
import type { LoginRequest } from '@/types/auth';

/** Ruta protegida por defecto a la que se redirige tras autenticarse (Req 7.5). */
const DEFAULT_PROTECTED_ROUTE = '/';

/** Retardo de la revalidación en modo `onChange` (Req 8.6). */
const VALIDATION_DEBOUNCE_MS = 500;

type LoginFormData = LoginRequest;
type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;

const INITIAL_FORM_DATA: LoginFormData = { username: '', password: '' };

/**
 * Valida los datos del formulario con `loginSchema` y devuelve los mensajes de
 * error por campo (vacío si es válido).
 */
function validarLogin(data: LoginFormData): LoginFormErrors {
  const resultado = loginSchema.safeParse(data);
  if (resultado.success) {
    return {};
  }

  const errores: LoginFormErrors = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path[0] as keyof LoginFormData | undefined;
    // Conservar el primer mensaje por campo.
    if (campo && !errores[campo]) {
      errores[campo] = issue.message;
    }
  }
  return errores;
}

/**
 * LoginPage (Formulario_Login): captura nombre de usuario y contraseña, valida
 * con `loginSchema` en modo `onChange` con debounce de ~500 ms (Req 8.6) y, con
 * datos válidos, invoca `authService.login` a través del contexto de
 * autenticación (Req 8.5). Si un usuario ya autenticado la visita, se le
 * redirige a la ruta protegida por defecto (Req 7.5).
 */
function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_DATA);
  const [errores, setErrores] = useState<LoginFormErrors>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Temporizadores de debounce por campo para la revalidación en `onChange`.
  const debounceTimersRef = useRef<Partial<Record<keyof LoginFormData, ReturnType<typeof setTimeout>>>>({});

  // Limpiar cualquier temporizador pendiente al desmontar.
  useEffect(() => {
    const timers = debounceTimersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const handleChange = useCallback((campo: keyof LoginFormData, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setErrorServidor(null);

    // Revalidar el campo modificado tras ~500 ms desde el último cambio (Req 8.6).
    const timers = debounceTimersRef.current;
    if (timers[campo]) {
      clearTimeout(timers[campo]);
    }
    timers[campo] = setTimeout(() => {
      setFormData((current) => {
        const erroresActuales = validarLogin(current);
        setErrores((prev) => ({ ...prev, [campo]: erroresActuales[campo] }));
        return current;
      });
    }, VALIDATION_DEBOUNCE_MS);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validación completa antes de enviar; con errores no se envía (Req 8.1-8.4).
    const erroresValidacion = validarLogin(formData);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    setErrores({});
    setErrorServidor(null);
    setSubmitting(true);

    try {
      // Datos válidos → invocar el login (que a su vez llama a authService.login
      // hacia `api/auth/login`) y persistir el token (Req 8.5).
      await login({ username: formData.username.trim(), password: formData.password });
      navigate(DEFAULT_PROTECTED_ROUTE, { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          setErrorServidor('Usuario o contraseña incorrectos.');
        } else if (status === 400) {
          setErrorServidor('Revisa los datos ingresados e intenta de nuevo.');
        } else {
          setErrorServidor('Ocurrió un error al iniciar sesión. Intenta nuevamente.');
        }
      } else if (error instanceof Error) {
        // Errores no HTTP (p. ej. fallo al persistir la sesión, Req 5.2).
        setErrorServidor(error.message);
      } else {
        setErrorServidor('Ocurrió un error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, login, navigate]);

  // Un usuario ya autenticado no debe ver el formulario (Req 7.5).
  if (isAuthenticated) {
    return <Navigate to={DEFAULT_PROTECTED_ROUTE} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardBody>
          {errorServidor && (
            <div
              role="alert"
              className="mb-4 rounded-[var(--radius-md)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {errorServidor}
            </div>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            noValidate
          >
            <Field
              label="Nombre de usuario"
              htmlFor="login-username"
              error={errores.username}
              errorId="error-username"
            >
              <Input
                id="login-username"
                type="text"
                autoComplete="username"
                maxLength={50}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                aria-invalid={!!errores.username}
                aria-describedby={errores.username ? 'error-username' : undefined}
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="login-password"
              error={errores.password}
              errorId="error-password"
            >
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                maxLength={64}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                aria-invalid={!!errores.password}
                aria-describedby={errores.password ? 'error-password' : undefined}
              />
            </Field>

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              <LogIn size={18} aria-hidden="true" />
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default LoginPage;
