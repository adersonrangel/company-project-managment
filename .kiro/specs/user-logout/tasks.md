# Implementation Plan: Cierre de sesión (user-logout)

## Overview

El enfoque es SOLO frontend (React 19 + TypeScript + Vite, alias `@/`). Se crea un
único componente `LogoutControl` con dos variantes de presentación (`sidebar` /
`topbar`) que orquesta el flujo de cierre de sesión reutilizando la infraestructura
de autenticación ya existente (`useAuth().logout`, `tokenStorage`, `ConfirmDialog`,
`ui/Dialog` sobre Radix). Luego se monta en `Layout` en ambas ubicaciones con
visibilidad por viewport. No se modifica `AuthContext`, `tokenStorage`, `api.ts` ni
`ProtectedRoute`; su comportamiento está definido en la spec `authentication-login-jwt`
y aquí solo se referencia.

Las tareas construyen la funcionalidad de forma incremental: primero el componente y
su lógica de estado, luego el flujo de `logout` con guardián de timeout, después la
integración en `Layout`, y por último las pruebas de propiedad y de ejemplo. Las
pruebas siguen la convención del proyecto: `frontend/src/components/__tests__/`, con
`*.property.test.tsx` para fast-check.

## Tasks

- [x] 1. Crear el componente `LogoutControl` y su lógica base
  - [x] 1.1 Crear el esqueleto de `LogoutControl` con el `Control_Cierre_Sesion` accesible
    - Crear `frontend/src/components/LogoutControl.tsx` con la prop `variant: 'sidebar' | 'topbar'`
    - Renderizar el botón usando el componente `Button` existente (`variant="ghost"` en sidebar; patrón de icono en topbar) para heredar `focus-visible:ring-2` (Req 5.2) y `disabled:opacity-50` (Req 1.4)
    - Exponer texto visible "Cerrar sesión" y `aria-label` explícito cuando la variante topbar muestre solo icono (nombre accesible no vacío)
    - Definir el estado interno con `useState`: `isDialogOpen`, `isLoggingOut`, `errorMessage`
    - Consumir `useAuth()` para obtener `logout` y `useNavigate()` para la redirección posterior
    - _Requirements: 1.1, 5.1, 5.2_

- [x] 2. Implementar la lógica de apertura, guardas y confirmación del diálogo
  - [x] 2.1 Implementar la activación del control y las guardas de duplicación
    - En `onClick` (Enter/Espacio los maneja el botón nativo → Req 5.3): si `isLoggingOut` es `true`, ignorar la activación (Req 1.5); si `isDialogOpen` es `true`, no reabrir (Req 2.2); en otro caso poner `isDialogOpen = true` (Req 2.1)
    - _Requirements: 1.5, 2.1, 2.2, 5.3_

  - [x] 2.2 Integrar `ConfirmDialog` con labels de logout y manejo de cancelación
    - Renderizar `ConfirmDialog` con `title="Cerrar sesión"`, `message="¿Seguro que quieres cerrar sesión?"`, `confirmLabel="Cerrar sesión"`, `cancelLabel="Cancelar"`, controlado por `isDialogOpen`
    - `onCancel` (mapea botón Cancelar, Escape y clic en overlay vía `onOpenChange(false)` de Radix): poner `isDialogOpen = false`, sin tocar el token ni la ruta; Radix devuelve el foco al control (Req 2.3, 2.4, 2.5, 5.6)
    - _Requirements: 2.3, 2.4, 2.5, 5.4, 5.5, 5.6_

  - [x] 2.3 Escribir prueba de propiedad para la unicidad del diálogo
    - Ubicación: `frontend/src/components/__tests__/LogoutControl.dialog-singleton.property.test.tsx`
    - **Property 3: A lo sumo un diálogo de confirmación** — generar N (1..10) activaciones consecutivas; assert de a lo sumo un elemento con `role="dialog"`
    - Etiqueta: `// Feature: user-logout, Property 3: Para N activaciones, existe a lo sumo un Dialogo_Confirmacion`
    - `fc.assert(fc.property(...), { numRuns: 100 })`
    - **Validates: Requirements 2.2**

- [x] 3. Implementar `performLogout` con guardián de timeout y ramas de resultado
  - [x] 3.1 Implementar la confirmación y la ejecución del cierre de sesión
    - `onConfirm`: cerrar el diálogo (`isDialogOpen = false`, Req 3.3), poner `isLoggingOut = true` para deshabilitar el control y mostrar indicador de progreso (Req 1.4) y ejecutar `performLogout()`
    - `performLogout()`: envolver `logout()` en `Promise.race` con un guardián de timeout de 5 s; en éxito → `navigate('/login', { replace: true })` (Req 3.1, 3.2)
    - _Requirements: 1.4, 3.1, 3.2, 3.3_

  - [x] 3.2 Implementar el manejo de fallo/timeout y el mensaje de error accesible
    - En fallo o expiración del guardián de 5 s: `isLoggingOut = false`, fijar `errorMessage` con texto de fallo, permanecer en la ruta actual, mantener el diálogo cerrado
    - Renderizar el mensaje de error de forma accesible (`role="alert"` o región live) sin bloquear la interfaz; permitir reintento activando de nuevo el control
    - _Requirements: 3.4, 4.4_

  - [x] 3.3 Escribir prueba de propiedad para la invocación única de `logout`
    - Ubicación: `frontend/src/components/__tests__/LogoutControl.single-invocation.property.test.tsx`
    - Mockear `logout` y `useNavigate` para aislar la lógica
    - **Property 1: Invocación única de `logout`** — generar N (1..10) activaciones y M (1..10) confirmaciones intercaladas; assert de `logout` llamado a lo sumo una vez (exactamente una si M>=1) y `navigate` a lo sumo una vez
    - Etiqueta: `// Feature: user-logout, Property 1: Para toda secuencia de activaciones y confirmaciones, logout se invoca a lo sumo una vez`
    - `fc.assert(fc.property(...), { numRuns: 100 })`
    - **Validates: Requirements 1.5, 3.1**

  - [x] 3.4 Escribir prueba de propiedad para el gating del borrado por confirmación
    - Ubicación: `frontend/src/components/__tests__/LogoutControl.confirmation-gating.property.test.tsx`
    - **Property 2: Gating del borrado por confirmación** — generar secuencias aleatorias de eventos sin confirmación (activar, cancelar, Escape, clic externo, reabrir); assert de `logout` nunca llamado y token intacto
    - Etiqueta: `// Feature: user-logout, Property 2: Sin confirmación, logout nunca se invoca y el JWT permanece intacto`
    - `fc.assert(fc.property(...), { numRuns: 100 })`
    - **Validates: Requirements 2.3, 2.5**

  - [x] 3.5 Escribir prueba de propiedad para la redirección condicionada al resultado
    - Ubicación: `frontend/src/components/__tests__/LogoutControl.redirect-on-result.property.test.tsx`
    - Mockear `logout` para producir el resultado como input (éxito | excepción | timeout) y `useNavigate`
    - **Property 4: Redirección condicionada al resultado** — assert de que `navigate('/login', { replace: true })` ocurre si y solo si el resultado es éxito; en fallo/timeout no se navega, hay mensaje de error y el diálogo está cerrado
    - Etiqueta: `// Feature: user-logout, Property 4: navigate('/login') ocurre si y solo si logout tuvo éxito`
    - `fc.assert(fc.property(...), { numRuns: 100 })`
    - **Validates: Requirements 3.2, 3.4**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrar `LogoutControl` en el `Layout` con visibilidad por viewport
  - [x] 5.1 Montar las dos instancias en `Layout.tsx`
    - Añadir `<LogoutControl variant="sidebar" />` dentro de `sidebar__footer` (visible en escritorio, >=1024px)
    - Añadir `<LogoutControl variant="topbar" />` en la `topbar`, junto a `ThemeToggle` tras el `topbar__spacer` (visible en móvil, <=1023px)
    - Resolver la conmutación de visibilidad por viewport con `useIsMobile(1023)` (ya presente) y/o clases utilitarias, garantizando que en móvil el control permanezca dentro del viewport, sin scroll horizontal y enfocable por teclado
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Ajustar `Layout.css` para el posicionamiento del control
    - Ubicar el control en el pie de la barra lateral en escritorio y en la barra superior en móvil; asegurar visibilidad y sin desplazamiento horizontal en el estado colapsado/oculto
    - _Requirements: 1.2, 1.3_

  - [x] 5.3 Escribir pruebas de ejemplo de renderizado y posicionamiento
    - Ubicación: `frontend/src/components/__tests__/LogoutControl.test.tsx`
    - Render: control presente con nombre accesible "Cerrar sesión" (Req 1.1, 5.1)
    - Posicionamiento por viewport con `matchMedia` simulado: instancia sidebar en escritorio, instancia topbar en móvil (Req 1.2, 1.3)
    - Activación abre el `Dialogo_Confirmacion` con clic y con teclado Enter/Espacio (Req 2.1, 5.3)
    - Confirmar: botón deshabilitado + indicador de progreso (Req 1.4); diálogo cerrado antes de navegar (Req 3.3)
    - Cancelación por botón, Escape y clic en overlay: diálogo cerrado, sesión conservada, foco de vuelta al control (Req 2.3, 2.4, 5.6); foco al abrir cae dentro del diálogo (Req 5.4)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 3.3, 5.1, 5.3, 5.4, 5.6_

- [x] 6. Añadir prueba de integración del estado consistente tras el cierre de sesión
  - [x] 6.1 Escribir prueba de integración con `AuthProvider` real
    - Ubicación: `frontend/src/components/__tests__/LogoutControl.integration.test.tsx`
    - Con `AuthProvider` real y token sembrado en `tokenStorage`: confirmar el cierre → assert de token ausente y `isAuthenticated=false` (Req 4.1)
    - Referenciar (smoke opcional) el comportamiento ya definido en la spec `authentication-login-jwt`: ausencia de `Authorization` en solicitudes posteriores (Req 4.2) y redirección del `Guardia_Ruta` a `/login` (Req 4.3), sin reimplementarlo
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Checkpoint final - Verificación de la suite del frontend
  - Ejecutar la suite de pruebas del frontend en modo de ejecución única (p. ej. `vitest --run`), el chequeo de tipos (typecheck) y el linter; corregir cualquier error detectado
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales (pruebas) y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos que cubre para trazabilidad.
- Las pruebas de propiedad validan las propiedades universales del diseño; las de ejemplo validan casos e interacciones concretas.
- No se modifica `AuthContext`, `tokenStorage`, `api.ts` ni `ProtectedRoute`; su comportamiento se referencia desde la spec `authentication-login-jwt`.
- Accesibilidad de foco atrapado, Escape y retorno de foco la provee Radix vía `ui/Dialog`; Enter/Espacio los cubre el botón nativo; el `focus-visible:ring-2` lo aporta el `Button` existente.
- Las pruebas de propiedad usan mínimo 100 iteraciones (`{ numRuns: 100 }`).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "2.3"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1"] }
  ]
}
```
