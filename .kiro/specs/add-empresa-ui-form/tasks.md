# Implementation Plan: Formulario Modal de Empresa

## Overview

Implementación de un formulario modal reutilizable para crear y editar empresas en la aplicación frontend. El plan sigue un enfoque incremental: primero la lógica de validación pura, luego el hook de manejo de estado, después el componente modal con accesibilidad, y finalmente la integración en la página existente.

## Tasks

- [x] 1. Implementar la función de validación y sus tests de propiedades
  - [x] 1.1 Crear la función utilitaria `validarCampos`
    - Crear el archivo `frontend/src/utils/validarEmpresaForm.ts`
    - Definir las interfaces `EmpresaFormData` y `EmpresaFormErrors`
    - Implementar la lógica de validación pura: campos obligatorios (no vacíos ni solo espacios), longitud mínima/máxima de nombre (2-100), dirección (5-200), formato de teléfono (solo dígitos, guiones y espacios) y cantidad de dígitos (7-15)
    - Exportar la función y los tipos para uso en el hook y en tests
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 1.2 Escribir test de propiedad: Rechazo de campos con solo espacios en blanco
    - **Propiedad 1: Rechazo de campos con solo espacios en blanco**
    - **Valida: Requisitos 4.1, 4.2, 4.3**
    - Crear `frontend/src/utils/__tests__/validarEmpresaForm.property.test.ts`
    - Usar fast-check para generar strings de whitespace (spaces, tabs, newlines) de longitud variable
    - Verificar que `validarCampos` retorna el mensaje de error "obligatorio" correspondiente a cada campo

  - [x]* 1.3 Escribir test de propiedad: Datos válidos pasan la validación
    - **Propiedad 2: Datos válidos pasan la validación**
    - **Valida: Requisitos 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5**
    - Generar objetos `EmpresaFormData` con valores dentro de los rangos válidos
    - Verificar que `validarCampos` retorna un objeto sin errores

  - [x]* 1.4 Escribir test de propiedad: Validación simultánea de múltiples campos inválidos
    - **Propiedad 3: Validación simultánea de múltiples campos inválidos**
    - **Valida: Requisitos 4.4**
    - Generar formularios con 1-3 campos inválidos
    - Verificar que retorna exactamente N mensajes de error para N campos inválidos

  - [x]* 1.5 Escribir test de propiedad: Límites de longitud del nombre
    - **Propiedad 4: Límites de longitud del nombre**
    - **Valida: Requisitos 5.1, 5.2**
    - Generar strings no-whitespace con longitud < 2 o > 100
    - Verificar que retorna error de longitud para el campo nombre

  - [x]* 1.6 Escribir test de propiedad: Formato inválido de teléfono
    - **Propiedad 5: Formato inválido de teléfono**
    - **Valida: Requisitos 5.3**
    - Generar strings con caracteres ilegales mezclados con dígitos
    - Verificar que retorna el error "El teléfono solo puede contener números, guiones y espacios"

  - [x]* 1.7 Escribir test de propiedad: Cantidad de dígitos del teléfono fuera de rango
    - **Propiedad 6: Cantidad de dígitos del teléfono fuera de rango**
    - **Valida: Requisitos 5.4**
    - Generar strings de dígitos+guiones+espacios con count de dígitos < 7 o > 15
    - Verificar que retorna el error "El teléfono debe tener entre 7 y 15 dígitos"

  - [x]* 1.8 Escribir test de propiedad: Límites de longitud de la dirección
    - **Propiedad 7: Límites de longitud de la dirección**
    - **Valida: Requisitos 5.5**
    - Generar strings no-whitespace con longitud < 5 o > 200
    - Verificar que retorna error de longitud para el campo dirección

- [x] 2. Checkpoint - Verificar validación
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 3. Implementar el hook personalizado `useEmpresaForm`
  - [x] 3.1 Crear el hook `useEmpresaForm`
    - Crear el archivo `frontend/src/hooks/useEmpresaForm.ts`
    - Implementar gestión de estado del formulario (formData, errores, errorServidor, submitting)
    - Implementar `handleChange` que actualiza el campo y re-evalúa la validación del campo modificado para limpiar errores
    - Implementar `handleSubmit` que ejecuta `validarCampos`, y si pasa invoca `empresaService.crear()` o `empresaService.actualizar()` según el modo
    - Implementar manejo de errores HTTP: 400 (mapear a campos), 409 (conflicto), 500 (error servidor), timeout 30s (ECONNABORTED)
    - Implementar `resetForm` para limpiar el estado
    - Configurar timeout de 30 segundos en las solicitudes Axios
    - _Requisitos: 4.5, 6.1, 6.4, 6.5, 7.1, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

  - [x]* 3.2 Escribir tests unitarios del hook `useEmpresaForm`
    - Crear `frontend/src/hooks/__tests__/useEmpresaForm.test.ts`
    - Testear inicialización en modo crear (campos vacíos) y modo editar (campos precargados)
    - Testear que `handleSubmit` no envía si hay errores de validación
    - Testear llamada a `empresaService.crear()` en modo crear y `empresaService.actualizar()` en modo editar
    - Testear manejo de errores 400, 409, 500 y timeout
    - Testear limpieza de errores al modificar campos
    - Mockear `empresaService` con vi.mock
    - _Requisitos: 6.1, 6.4, 6.5, 7.1, 7.4, 7.5, 8.1, 8.3, 8.4_

- [x] 4. Implementar el componente `EmpresaFormModal`
  - [x] 4.1 Crear el componente `EmpresaFormModal` y sus estilos
    - Crear `frontend/src/components/EmpresaFormModal.tsx`
    - Crear `frontend/src/components/EmpresaFormModal.css`
    - Implementar overlay semitransparente que cubre la página
    - Implementar contenedor centrado del modal con `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
    - Implementar título dinámico ("Agregar Empresa" / "Editar Empresa") según el modo
    - Renderizar campos Nombre, Dirección, Teléfono con labels, placeholders y `maxLength`
    - Mostrar errores de validación por campo con borde rojo y mensaje debajo
    - Mostrar error de servidor en la parte superior del formulario con estilo de alerta
    - Implementar botón "Guardar" (deshabilitado durante envío, con indicador de carga) y botón "Cancelar"
    - Usar `useEmpresaForm` internamente para la lógica de formulario
    - _Requisitos: 1.2, 1.4, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 6.4, 7.4, 8.1, 8.2, 8.4_

  - [x] 4.2 Implementar focus trap y manejo de teclado en el modal
    - Implementar focus trap: restringir tabulación a elementos dentro del modal
    - Al abrir el modal, enfocar automáticamente el primer campo (nombre)
    - Cerrar modal al presionar Escape (excepto durante envío)
    - Cerrar modal al hacer clic en overlay (excepto durante envío)
    - Restaurar foco al elemento que abrió el modal al cerrarse
    - Implementar `aria-live="polite"` o `role="alert"` para anunciar errores
    - _Requisitos: 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x]* 4.3 Escribir tests unitarios del componente `EmpresaFormModal`
    - Crear `frontend/src/components/__tests__/EmpresaFormModal.test.tsx`
    - Instalar dependencias de test: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `fast-check`
    - Testear renderizado correcto de campos, labels y botones
    - Testear atributos ARIA (role, aria-modal, aria-labelledby)
    - Testear cierre por Escape, clic en overlay y botón cancelar
    - Testear que no cierra durante envío
    - Testear focus trap y auto-focus en primer campo
    - Testear modo edición con datos precargados
    - Testear estado de carga del botón guardar
    - _Requisitos: 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 5. Checkpoint - Verificar componente modal
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 6. Integrar el modal en EmpresasPage
  - [x] 6.1 Modificar `EmpresasPage` para agregar botones y estado del modal
    - Agregar estado `ModalState` (isOpen, modo, empresa) a `EmpresasPage`
    - Agregar botón "Agregar Empresa" en la cabecera junto al título
    - Agregar botón "Editar" en la columna de acciones de cada fila de la tabla
    - Renderizar `EmpresaFormModal` con las props correspondientes
    - Implementar callback `onSuccess`: agregar empresa nueva a la tabla (modo crear) o reemplazar datos de la fila (modo editar) sin recargar la página
    - Guardar referencia al botón que abrió el modal para restaurar foco al cerrarse
    - _Requisitos: 1.1, 1.2, 1.5, 2.1, 2.2, 6.2, 6.3, 7.2, 7.3, 9.4, 9.6, 10.5_

  - [x]* 6.2 Escribir tests de integración de EmpresasPage con el modal
    - Crear `frontend/src/pages/__tests__/EmpresasPage.integration.test.tsx`
    - Testear flujo completo de creación: abrir modal → completar campos → guardar → verificar empresa en tabla
    - Testear flujo completo de edición: clic editar → verificar datos precargados → modificar → guardar → verificar fila actualizada
    - Testear flujo de error: guardar con error de servidor → verificar que modal permanece abierto
    - Mockear `empresaService` y verificar llamadas correctas
    - _Requisitos: 1.1, 1.2, 2.1, 2.2, 6.2, 6.3, 7.2, 7.3, 8.2_

- [x] 7. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan las propiedades de correctitud universales definidas en el diseño
- Los tests unitarios validan ejemplos específicos y casos borde
- Se requiere instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` y `fast-check` como dependencias de desarrollo

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["4.3", "6.1"] },
    { "id": 5, "tasks": ["6.2"] }
  ]
}
```
