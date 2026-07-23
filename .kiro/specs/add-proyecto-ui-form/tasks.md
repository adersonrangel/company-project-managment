# Implementation Plan: Formulario UI para Proyecto

## Overview

Implementación del formulario modal para crear y editar proyectos siguiendo el patrón EmpresaFormModal + useEmpresaForm. Se reemplazan los tipos TypeScript actuales para alinearlos con los DTOs del backend, se crea la lógica de validación pura, un hook de gestión del formulario, el componente modal, un componente de notificaciones, y se integra todo en ProyectosPage.

## Tasks

- [x] 1. Definir tipos TypeScript y actualizar servicio
  - [x] 1.1 Reemplazar tipos en `src/types/proyecto.ts`
    - Eliminar las interfaces actuales (`Proyecto`, `CrearProyectoRequest`, `ActualizarProyectoRequest`)
    - Crear `ProyectoListResponse` con campos: `id: number`, `nombre: string`, `fechaHabilitacion: string`, `estadoHabilitacion: boolean`
    - Crear `ProyectoResponse` con campos: `id: number`, `nombre: string`, `fechaHabilitacion: string`, `estadoHabilitacion: boolean`, `empresaId: number`
    - Crear `CrearProyectoRequest` con campos: `nombre: string`, `fechaHabilitacion: string`, `estadoHabilitacion?: boolean`
    - Crear `ActualizarProyectoRequest` con campos opcionales: `nombre?: string`, `fechaHabilitacion?: string`, `estadoHabilitacion?: boolean`
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 1.2 Actualizar `src/services/proyectoService.ts` con nuevos tipos
    - Cambiar imports a los nuevos tipos (`ProyectoListResponse`, `ProyectoResponse`, `CrearProyectoRequest`, `ActualizarProyectoRequest`)
    - Cambiar retorno de `listar` a `ProyectoListResponse[]`
    - Cambiar retorno de `obtenerPorId`, `crear`, `actualizar` a `ProyectoResponse`
    - Agregar parámetro de config opcional para timeout (`{ timeout: 30000 }`) en `crear` y `actualizar`
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6_

- [x] 2. Implementar validación pura del formulario
  - [x] 2.1 Crear `src/utils/validarProyectoForm.ts`
    - Exportar interfaces `ProyectoFormData` (nombre, fechaHabilitacion, estadoHabilitacion) y `ProyectoFormErrors` (nombre?, fechaHabilitacion?)
    - Implementar función `validarCampos(formData: ProyectoFormData): ProyectoFormErrors`
    - Reglas para nombre: vacío/espacios → "El nombre es obligatorio"; trimmed < 2 → "El nombre debe tener al menos 2 caracteres"; trimmed > 100 → "El nombre no puede exceder 100 caracteres"
    - Reglas para fechaHabilitacion: vacía → "La fecha de habilitación es obligatoria"; formato inválido/fecha inexistente → "La fecha de habilitación debe ser una fecha válida"; anterior a 2000-01-01 → "La fecha de habilitación no puede ser anterior al año 2000"; más de 10 años en el futuro → "La fecha de habilitación no puede ser superior a 10 años en el futuro"
    - Usar validación de fecha nativa con reconstrucción de componentes para detectar fechas inexistentes (e.g., 2024-02-30)
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 2.2 Write property test: Validación completa de nombre
    - **Property 1: Validación completa de nombre**
    - **Validates: Requirements 4.1, 5.1, 5.2**
    - Crear `src/utils/__tests__/validarProyectoForm.property.test.ts`
    - Usar `fast-check` con generador de strings arbitrarios
    - Verificar que `validarCampos` retorna el error correcto según longitud trimmed del nombre
    - Mínimo 100 iteraciones con `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x]* 2.3 Write property test: Validación completa de fecha de habilitación
    - **Property 2: Validación completa de fecha de habilitación**
    - **Validates: Requirements 4.2, 5.3, 5.4, 5.5**
    - Agregar al archivo `src/utils/__tests__/validarProyectoForm.property.test.ts`
    - Usar `fast-check` con generadores de strings arbitrarios, fechas válidas, fechas fuera de rango
    - Verificar que `validarCampos` retorna el error correcto para cada caso de fecha
    - Mínimo 100 iteraciones con `fc.assert(fc.property(...), { numRuns: 100 })`

- [x] 3. Implementar hook de gestión del formulario
  - [x] 3.1 Crear `src/hooks/useProyectoForm.ts`
    - Definir interfaces `UseProyectoFormOptions` (modo, empresaId, proyectoInicial, onSuccess, onClose) y `UseProyectoFormReturn` (formData, errores, errorServidor, submitting, handleChange, handleSubmit, resetForm)
    - Implementar estado inicial: modo crear → campos vacíos con estadoHabilitacion=true; modo editar → pre-cargar datos de proyectoInicial
    - Implementar `handleChange`: actualiza campo, re-evalúa validación del campo modificado, limpia errores de servidor
    - Implementar `handleSubmit`: ejecuta validarCampos, si hay errores los muestra y no envía; si no hay errores llama a proyectoService.crear o actualizar según modo
    - Manejo de errores HTTP: 400 (mapea errores a campos), 404 (banner "La empresa asociada no fue encontrada."), 409 (banner con response.data.mensaje), 500 (banner genérico), red/timeout (banners correspondientes)
    - Timeout de 30 segundos, rehabilitación de botón Guardar en caso de error
    - Implementar `resetForm`: restaurar a estado inicial según modo
    - Seguir exactamente el patrón de `useEmpresaForm`
    - _Requirements: 4.3, 4.4, 4.5, 5.6, 6.1, 6.5, 6.6, 6.7, 7.1, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x]* 3.2 Write property test: Mapeo de errores de servidor a campos
    - **Property 3: Mapeo de errores de servidor a campos del formulario**
    - **Validates: Requirement 8.3**
    - Crear `src/hooks/__tests__/useProyectoForm.property.test.ts`
    - Usar `fast-check` con generador de diccionarios con claves aleatorias
    - Verificar que claves coincidentes con campos conocidos (nombre, fechaHabilitacion) se muestran como errores de campo, y claves no reconocidas van al banner
    - Mínimo 100 iteraciones

  - [x]* 3.3 Write property test: Reset de estado del formulario al cerrar
    - **Property 4: Reset de estado del formulario al cerrar**
    - **Validates: Requirement 9.4**
    - Agregar al archivo `src/hooks/__tests__/useProyectoForm.property.test.ts`
    - Usar `fast-check` con generador de datos de formulario aleatorios
    - Verificar que después de resetForm en modo creación los campos están en estado inicial, y en modo edición contienen datos originales
    - Mínimo 100 iteraciones

- [x] 4. Checkpoint - Verificar validación y hook
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar componentes UI
  - [x] 5.1 Crear componente `src/components/Notificacion.tsx` y `src/components/Notificacion.css`
    - Implementar props: `mensaje: string`, `tipo: 'exito' | 'error'`, `visible: boolean`, `onClose: () => void`
    - Color verde para éxito, rojo para error
    - Auto-dismiss después de 4 segundos, cancelar timer si se cierra manualmente
    - Botón de cierre "×"
    - `role="alert"` para accesibilidad
    - Reemplazo de notificación existente reinicia timer
    - CSS con clases `.notificacion`, `.notificacion--exito`, `.notificacion--error`, `.notificacion__close`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 5.2 Crear componente `src/components/ProyectoFormModal.tsx`
    - Implementar props: `isOpen`, `modo`, `empresaId`, `proyectoInicial`, `onClose`, `onSuccess`
    - Campos: input text "Nombre" (maxLength=100, placeholder="Nombre del proyecto"), input date "Fecha de Habilitación" (min="2000-01-01"), checkbox "Proyecto habilitado"
    - Reutilizar clases CSS de EmpresaFormModal.css (importar directamente)
    - Focus trap con Tab/Shift+Tab
    - Auto-focus en primer campo al abrir
    - Cierre con Escape (cuando no está submitting), clic en overlay, botón Cancelar
    - Deshabilitación de controles durante envío (Guardar → "Guardando...", Cancelar deshabilitado)
    - Banner de error del servidor en parte superior
    - Atributos ARIA: role="dialog", aria-modal="true", aria-labelledby, aria-invalid, aria-describedby, aria-live="polite" para errores
    - Labels asociados programáticamente con htmlFor
    - Restaurar foco al elemento que abrió el modal al cerrar
    - Orden de campos: Nombre, Fecha de Habilitación, Estado de Habilitación, botones [Cancelar, Guardar]
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.4, 6.5, 7.4, 7.5, 8.1, 8.2, 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x]* 5.3 Write unit tests for ProyectoFormModal
    - Crear `src/components/__tests__/ProyectoFormModal.test.tsx`
    - Test renderizado modo crear (campos vacíos, título "Agregar Proyecto")
    - Test renderizado modo editar (campos precargados, título "Editar Proyecto")
    - Test focus trap y auto-focus en primer campo
    - Test cierre por Escape, overlay click, botón Cancelar
    - Test deshabilitación durante envío
    - Test atributos ARIA presentes
    - _Requirements: 1.2, 1.4, 2.2, 2.3, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4_

  - [x]* 5.4 Write unit tests for Notificacion
    - Crear `src/components/__tests__/Notificacion.test.tsx`
    - Test renderizado tipo éxito (verde) y error (rojo)
    - Test auto-dismiss a 4 segundos con fake timers
    - Test cierre manual cancela timer
    - Test role="alert" presente
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 6. Integrar en ProyectosPage
  - [x] 6.1 Modificar `src/pages/ProyectosPage.tsx`
    - Cambiar tipo `Proyecto` a `ProyectoListResponse` en el estado
    - Agregar estado para modal: `modalAbierto: boolean`, `modoModal: 'crear' | 'editar'`, `proyectoEditar: ProyectoListResponse | null`
    - Agregar estado para notificación: `notificacion: { mensaje: string, tipo: 'exito' | 'error', visible: boolean }`
    - Agregar botón "Agregar Proyecto" en el header junto al título
    - Cambiar columnas de tabla a: Nombre, Fecha de Habilitación, Estado, Acciones
    - Agregar botón "Editar" en cada fila (columna Acciones, junto a Eliminar)
    - Validar que proyecto no sea null antes de abrir modal edición (mostrar notificación error si es null)
    - Integrar componente `ProyectoFormModal` con props adecuadas
    - Integrar componente `Notificacion`
    - Implementar callbacks: `handleCrearExito` (agregar al listado + notificación), `handleEditarExito` (reemplazar en listado + notificación), `handleCerrarModal` (resetear estado modal)
    - Ignorar apertura de segundo modal si ya hay uno abierto
    - _Requirements: 1.1, 1.5, 2.1, 2.4, 2.5, 6.2, 6.3, 7.2, 7.3, 9.4, 9.6, 11.4, 12.1, 12.2, 12.6_

  - [x]* 6.2 Write unit tests for ProyectosPage integration
    - Crear `src/pages/__tests__/ProyectosPage.test.tsx`
    - Test flujo crear proyecto: abrir modal → llenar → guardar → tabla actualizada + notificación
    - Test flujo editar proyecto: clic editar → modal con datos precargados → guardar → fila actualizada
    - Test notificación de error cuando proyecto es null al editar
    - Test que no se abre segundo modal si ya hay uno abierto
    - Mock de proyectoService
    - _Requirements: 1.1, 1.5, 2.1, 2.4, 6.2, 6.3, 7.2, 7.3_

- [x] 7. Final checkpoint - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in design
- Unit tests validate specific examples, edge cases, and UI behaviors
- Se reutilizan las clases CSS de EmpresaFormModal.css para mantener consistencia visual
- El hook `useProyectoForm` sigue exactamente el patrón de `useEmpresaForm` adaptado al dominio de proyectos
- La función `validarCampos` es pura y sin efectos secundarios para facilitar testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.4"] },
    { "id": 5, "tasks": ["5.3", "6.1"] },
    { "id": 6, "tasks": ["6.2"] }
  ]
}
```
