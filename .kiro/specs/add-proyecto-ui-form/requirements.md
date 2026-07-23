# Requirements Document

## Introduction

Esta funcionalidad agrega un formulario modal en la interfaz de usuario para crear y editar proyectos dentro del contexto de una empresa. El formulario se presenta como un diálogo emergente (modal) sobre la página de listado de proyectos (`ProyectosPage`), siguiendo el mismo patrón implementado para empresas (`EmpresaFormModal`). Los campos del formulario se alinean con los DTOs del backend: `nombre`, `fechaHabilitacion` y `estadoHabilitacion`. Incluye validaciones client-side, notificaciones de éxito/error, y accesibilidad completa.

## Glossary

- **Modal**: Componente de diálogo emergente que se superpone sobre el contenido de la página y bloquea la interacción con el fondo hasta que se cierra.
- **Formulario_Proyecto**: Formulario modal que contiene los campos necesarios para crear o editar un proyecto (nombre, fecha de habilitación, estado de habilitación).
- **Overlay**: Capa semitransparente que cubre el fondo de la página cuando el Modal está activo.
- **Validador_Campos**: Lógica de validación del lado del cliente que verifica los campos del formulario antes del envío.
- **ProyectosPage**: Página que muestra el listado de proyectos de una empresa específica, accesible por la ruta `/empresas/:empresaId/proyectos`.
- **Servicio_Proyecto**: Capa de servicio frontend (`proyectoService`) que comunica con la API backend para operaciones CRUD de proyectos bajo la ruta `api/empresas/{empresaId}/proyectos`.
- **Notificación**: Mensaje temporal (toast) que informa al usuario el resultado de una operación (éxito o error) y desaparece automáticamente.
- **Fecha_Habilitacion**: Campo de tipo fecha (formato ISO date string) que indica la fecha de habilitación del proyecto.
- **Estado_Habilitacion**: Campo booleano (checkbox) que indica si el proyecto está habilitado o no. Por defecto es `true` al crear.

## Requirements

### Requisito 1: Apertura del modal para crear proyecto

**Historia de usuario:** Como usuario, quiero hacer clic en un botón "Agregar Proyecto" para abrir un formulario modal, para poder registrar un nuevo proyecto sin salir de la página de listado.

#### Criterios de Aceptación

1. THE ProyectosPage SHALL mostrar un botón "Agregar Proyecto" en la sección superior junto al título de la página.
2. WHEN el usuario hace clic en el botón "Agregar Proyecto", THE Formulario_Proyecto SHALL abrirse como un Modal centrado en la pantalla con el campo "Nombre" vacío, el campo "Fecha de Habilitación" vacío, y el campo "Estado de Habilitación" marcado como habilitado (true).
3. WHILE el Modal está abierto, THE Overlay SHALL cubrir el fondo de la página con una capa semitransparente (opacidad entre 0.4 y 0.6) y bloquear la interacción con los elementos de la página subyacente.
4. WHILE el Modal está abierto, THE Formulario_Proyecto SHALL mostrar el título "Agregar Proyecto" en la cabecera del modal.
5. WHILE el Modal está abierto, THE ProyectosPage SHALL ignorar clics en el botón "Agregar Proyecto" y no abrir un segundo modal.

### Requisito 2: Apertura del modal para editar proyecto

**Historia de usuario:** Como usuario, quiero hacer clic en un botón "Editar" en cada fila de la tabla de proyectos, para poder modificar los datos de un proyecto existente sin salir de la página de listado.

#### Criterios de Aceptación

1. THE ProyectosPage SHALL mostrar un botón "Editar" en la columna de acciones de cada fila de la tabla.
2. WHEN el usuario hace clic en el botón "Editar" de un proyecto, THE Formulario_Proyecto SHALL abrirse como un Modal centrado en la pantalla con los campos precargados con los datos del proyecto correspondientes a esa fila de la tabla: el campo "Nombre" con el nombre del proyecto, el campo "Fecha de Habilitación" con la fecha de habilitación del proyecto, y el campo "Estado de Habilitación" con el valor booleano del estado actual del proyecto.
3. WHEN el Modal se abre en modo edición, THE Formulario_Proyecto SHALL mostrar el título "Editar Proyecto" en la cabecera del modal.
4. IF los datos del proyecto seleccionado son nulos o indefinidos al momento de intentar abrir el formulario de edición, THEN THE ProyectosPage SHALL mostrar una Notificación de error indicando que no fue posible abrir el formulario de edición, y el Modal no se abrirá.
5. WHILE el Modal está abierto en modo edición, THE ProyectosPage SHALL ignorar clics en los botones "Editar" de otras filas y en el botón "Agregar Proyecto", y no abrir un segundo modal.

### Requisito 3: Estructura del formulario

**Historia de usuario:** Como usuario, quiero ver un formulario claro con los campos nombre, fecha de habilitación y estado de habilitación, para poder ingresar los datos del proyecto de forma sencilla.

#### Criterios de Aceptación

1. THE Formulario_Proyecto SHALL contener un campo de texto para "Nombre" con placeholder "Nombre del proyecto", una longitud mínima de 2 caracteres y una longitud máxima de 100 caracteres.
2. THE Formulario_Proyecto SHALL contener un campo de tipo fecha (date input) para "Fecha de Habilitación" con placeholder "Seleccione una fecha", que acepte fechas en formato ISO (YYYY-MM-DD) desde el año 2000 en adelante.
3. THE Formulario_Proyecto SHALL contener un campo checkbox para "Estado de Habilitación" con la etiqueta "Proyecto habilitado", marcado por defecto en modo creación.
4. THE Formulario_Proyecto SHALL contener un botón "Guardar" con un color de acento que cumpla un ratio de contraste mínimo de 4.5:1 respecto al fondo, visualmente diferenciado del botón "Cancelar", para enviar el formulario.
5. THE Formulario_Proyecto SHALL contener un botón "Cancelar" para cerrar el modal sin guardar cambios.
6. THE Formulario_Proyecto SHALL mostrar etiquetas visibles encima de cada campo de entrada ("Nombre", "Fecha de Habilitación", "Proyecto habilitado"), asociadas programáticamente a su campo correspondiente mediante atributos de accesibilidad.
7. THE Formulario_Proyecto SHALL presentar los campos en orden vertical: Nombre, Fecha de Habilitación, Estado de Habilitación, seguidos de los botones de acción en el orden "Cancelar" (izquierda) y "Guardar" (derecha).

### Requisito 4: Validación de campos obligatorios

**Historia de usuario:** Como usuario, quiero recibir mensajes claros cuando no completo los campos obligatorios, para poder corregir los errores antes de enviar el formulario.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en el botón "Guardar" con el campo "Nombre" vacío o que contiene solo espacios en blanco, THE Validador_Campos SHALL mostrar el mensaje "El nombre es obligatorio" debajo del campo y aplicar un borde de color de error al campo.
2. WHEN el usuario hace clic en el botón "Guardar" con el campo "Fecha de Habilitación" vacío, THE Validador_Campos SHALL mostrar el mensaje "La fecha de habilitación es obligatoria" debajo del campo y aplicar un borde de color de error al campo.
3. WHILE existan errores de validación en uno o más campos, THE Formulario_Proyecto SHALL deshabilitar el envío de datos al Servicio_Proyecto y mostrar todos los mensajes de error simultáneamente (uno por cada campo inválido).
4. WHEN el usuario modifica el valor de un campo que tenía error de validación, THE Validador_Campos SHALL re-evaluar ese campo en cada evento de entrada (input) y ocultar el mensaje de error y el borde de error si el nuevo valor cumple las reglas de validación.
5. IF el usuario modifica un campo previamente corregido y el nuevo valor vuelve a ser inválido, THEN THE Validador_Campos SHALL mostrar nuevamente el mensaje de error correspondiente debajo del campo y aplicar el borde de color de error.

### Requisito 5: Validación de formato de campos

**Historia de usuario:** Como usuario, quiero que el sistema valide el formato de los datos ingresados, para evitar enviar información incorrecta al servidor.

#### Criterios de Aceptación

1. WHEN el usuario intenta enviar el formulario con un nombre que tiene menos de 2 caracteres (sin contar espacios al inicio y final), THE Validador_Campos SHALL mostrar el mensaje "El nombre debe tener al menos 2 caracteres" debajo del campo "Nombre" y aplicar un borde de color de error al campo.
2. WHEN el usuario intenta enviar el formulario con un nombre que excede 100 caracteres, THE Validador_Campos SHALL mostrar el mensaje "El nombre no puede exceder 100 caracteres" debajo del campo "Nombre" y aplicar un borde de color de error al campo.
3. WHEN el usuario intenta enviar el formulario con una fecha de habilitación que no corresponde a una fecha existente en formato ISO (YYYY-MM-DD) (por ejemplo, 2024-02-30 o texto no numérico), THE Validador_Campos SHALL mostrar el mensaje "La fecha de habilitación debe ser una fecha válida" debajo del campo "Fecha de Habilitación" y aplicar un borde de color de error al campo.
4. WHEN el usuario intenta enviar el formulario con una fecha de habilitación anterior al 2000-01-01, THE Validador_Campos SHALL mostrar el mensaje "La fecha de habilitación no puede ser anterior al año 2000" debajo del campo "Fecha de Habilitación" y aplicar un borde de color de error al campo.
5. WHEN el usuario intenta enviar el formulario con una fecha de habilitación posterior a 10 años a partir de la fecha actual, THE Validador_Campos SHALL mostrar el mensaje "La fecha de habilitación no puede ser superior a 10 años en el futuro" debajo del campo "Fecha de Habilitación" y aplicar un borde de color de error al campo.
6. WHEN el usuario modifica un campo que presenta error de formato, THE Validador_Campos SHALL re-evaluar únicamente la validación de formato del campo modificado y ocultar el mensaje de error si el nuevo valor cumple las reglas de formato definidas en los criterios 1 a 5.

### Requisito 6: Envío exitoso del formulario para crear proyecto

**Historia de usuario:** Como usuario, quiero que al guardar un nuevo proyecto el sistema lo registre y actualice la tabla, para ver inmediatamente el proyecto recién creado.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en "Guardar" con todos los campos válidos en modo creación, THE Servicio_Proyecto SHALL enviar una solicitud POST a la ruta `api/empresas/{empresaId}/proyectos` con los campos nombre, fechaHabilitacion y estadoHabilitacion del formulario.
2. WHEN la API responde exitosamente a la creación, THE ProyectosPage SHALL agregar el nuevo proyecto al final del listado de la tabla utilizando los datos devueltos por la API (id, nombre, fechaHabilitacion, estadoHabilitacion), sin recargar la página completa.
3. WHEN la API responde exitosamente a la creación, THE ProyectosPage SHALL mostrar una Notificación de éxito con el mensaje "Proyecto creado exitosamente" que desaparezca automáticamente después de 4 segundos.
4. WHEN la API responde exitosamente a la creación, THE Modal SHALL cerrarse automáticamente.
5. WHILE el Servicio_Proyecto está procesando la solicitud de creación, THE Formulario_Proyecto SHALL deshabilitar el botón "Guardar" y mostrar el texto "Guardando..." en lugar de "Guardar".
6. IF el Servicio_Proyecto no recibe respuesta de la API dentro de 30 segundos, THEN THE Formulario_Proyecto SHALL restaurar el botón "Guardar" a su estado habilitado, mantener el Modal abierto con los datos del formulario intactos, y THE ProyectosPage SHALL mostrar una Notificación de error indicando que la operación no pudo completarse por tiempo de espera.
7. IF la solicitud POST falla por un error de red (sin respuesta del servidor), THEN THE Formulario_Proyecto SHALL restaurar el botón "Guardar" a su estado habilitado, mantener el Modal abierto con los datos del formulario intactos, y THE ProyectosPage SHALL mostrar una Notificación de error indicando que no se pudo conectar con el servidor.

### Requisito 7: Envío exitoso del formulario para editar proyecto

**Historia de usuario:** Como usuario, quiero que al guardar los cambios de un proyecto existente el sistema actualice los datos y la tabla, para ver los cambios reflejados inmediatamente.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en "Guardar" con todos los campos válidos en modo edición, THE Servicio_Proyecto SHALL enviar una solicitud PUT a la ruta `api/empresas/{empresaId}/proyectos/{proyectoId}` con los campos nombre, fechaHabilitacion y estadoHabilitacion con los valores actualizados del formulario.
2. WHEN la API retorna el proyecto actualizado en la respuesta a la solicitud PUT, THE ProyectosPage SHALL reemplazar los datos de la fila cuyo identificador coincide con el proyecto editado, mostrando los valores actualizados sin recargar la página completa.
3. WHEN la API retorna el proyecto actualizado en la respuesta a la solicitud PUT, THE ProyectosPage SHALL mostrar una Notificación de éxito con el mensaje "Proyecto actualizado exitosamente" que desaparezca automáticamente después de 4 segundos.
4. WHEN la API retorna el proyecto actualizado, THE Modal SHALL cerrarse automáticamente.
5. WHILE el Servicio_Proyecto está procesando la solicitud de actualización, THE Formulario_Proyecto SHALL deshabilitar el botón "Guardar" y mostrar el texto "Guardando..." en lugar de "Guardar", y deshabilitar el botón "Cancelar".
6. IF el Servicio_Proyecto no recibe respuesta de la API dentro de 30 segundos, THEN THE Formulario_Proyecto SHALL rehabilitar el botón "Guardar" con su texto original, rehabilitar el botón "Cancelar", mantener el Modal abierto con los datos del formulario intactos, y THE ProyectosPage SHALL mostrar una Notificación de error indicando que la solicitud excedió el tiempo de espera.

### Requisito 8: Manejo de errores del servidor

**Historia de usuario:** Como usuario, quiero ser informado cuando ocurre un error al guardar, para saber que la operación no se completó y poder intentarlo de nuevo.

#### Criterios de Aceptación

1. IF la API devuelve un error con código de estado 500, THEN THE Formulario_Proyecto SHALL mostrar el mensaje "Ocurrió un error en el servidor. Intente nuevamente." en la parte superior del formulario con estilo de alerta de error, y rehabilitar el botón "Guardar" con su texto original.
2. IF la API devuelve un error (códigos 400, 404, 409, 500 o error de red), THEN THE Modal SHALL permanecer abierto con todos los datos del formulario intactos y rehabilitar el botón "Guardar" con su texto original para que el usuario pueda corregir los datos o reintentar.
3. IF la API devuelve un error de validación del servidor (código 400) con un cuerpo que contiene un diccionario de errores por campo, THEN THE Formulario_Proyecto SHALL mostrar los mensajes de error debajo de cada campo cuyo nombre coincida con una clave del diccionario, y mostrar los errores de campos no reconocidos en la parte superior del formulario junto con el mensaje general de la respuesta.
4. IF la API devuelve un error de conflicto (código 409), THEN THE Formulario_Proyecto SHALL mostrar el mensaje contenido en la propiedad "mensaje" de la respuesta de error en la parte superior del formulario con estilo de alerta de error.
5. IF la API devuelve un error 404 (empresa no encontrada), THEN THE Formulario_Proyecto SHALL mostrar el mensaje "La empresa asociada no fue encontrada." en la parte superior del formulario con estilo de alerta de error.
6. WHEN el usuario modifica cualquier campo del formulario o hace clic en "Guardar" para reintentar, THE Formulario_Proyecto SHALL ocultar todos los mensajes de error de servidor mostrados previamente en la parte superior del formulario.
7. IF la API no responde o ocurre un error de red (sin código de estado HTTP), THEN THE Formulario_Proyecto SHALL mostrar el mensaje "No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente." en la parte superior del formulario con estilo de alerta de error.

### Requisito 9: Cierre del modal

**Historia de usuario:** Como usuario, quiero poder cerrar el formulario modal de diferentes maneras, para tener flexibilidad en la interacción con la interfaz.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en el botón "Cancelar", THE Modal SHALL cerrarse, ocultar el Overlay, y no enviar datos al Servicio_Proyecto.
2. WHEN el usuario hace clic en el Overlay fuera del modal, THE Modal SHALL cerrarse, ocultar el Overlay, y no enviar datos al Servicio_Proyecto.
3. WHEN el usuario presiona la tecla Escape, THE Modal SHALL cerrarse, ocultar el Overlay, y no enviar datos al Servicio_Proyecto.
4. WHEN el Modal se cierra sin guardar, THE Formulario_Proyecto SHALL descartar los datos ingresados y restablecer el formulario a su estado inicial, de modo que al reabrir el modal en modo creación los campos estén vacíos (excepto estadoHabilitacion que vuelve a true), o en modo edición contengan los datos originales del proyecto.
5. WHILE el Servicio_Proyecto está procesando una solicitud, THE Modal SHALL deshabilitar el botón "Cancelar" e ignorar los intentos de cierre mediante clic en el Overlay o tecla Escape hasta que la solicitud finalice o falle.
6. WHEN el Modal se cierra, THE ProyectosPage SHALL devolver el foco al elemento que activó la apertura del modal.

### Requisito 10: Accesibilidad del modal

**Historia de usuario:** Como usuario que utiliza tecnologías asistivas, quiero que el formulario modal sea accesible, para poder interactuar con la funcionalidad mediante teclado y lectores de pantalla.

#### Criterios de Aceptación

1. WHEN el Modal se abre, THE Formulario_Proyecto SHALL enfocar automáticamente el primer campo del formulario ("Nombre").
2. THE Modal SHALL utilizar el atributo role="dialog" y aria-modal="true" para comunicar su propósito a lectores de pantalla.
3. THE Modal SHALL utilizar aria-labelledby para asociar el título del modal como etiqueta accesible.
4. WHILE el Modal está abierto, THE Modal SHALL restringir la navegación por tabulación a los elementos dentro del modal (focus trap): al presionar Tab en el último elemento enfocable el foco vuelve al primer elemento, y al presionar Shift+Tab en el primer elemento enfocable el foco vuelve al último elemento.
5. WHEN el Modal se cierra, THE ProyectosPage SHALL restaurar el foco al botón que originó la apertura del modal.
6. WHEN el Validador_Campos muestra errores de validación, THE Modal SHALL anunciar los errores a lectores de pantalla mediante una región aria-live="polite".
7. THE Formulario_Proyecto SHALL asociar programáticamente cada etiqueta de campo con su input correspondiente mediante el atributo `for`/`htmlFor` y un `id` único en cada campo.

### Requisito 11: Actualización de tipos frontend

**Historia de usuario:** Como desarrollador, quiero que los tipos TypeScript del frontend se alineen con los DTOs del backend, para que la comunicación sea consistente y evitar errores de integración.

#### Criterios de Aceptación

1. THE Servicio_Proyecto SHALL utilizar el tipo TypeScript `CrearProyectoRequest` con los campos `nombre` (string, requerido, máximo 200 caracteres), `fechaHabilitacion` (string en formato ISO 8601 `YYYY-MM-DD`, requerido), y `estadoHabilitacion` (boolean, opcional), alineado con el DTO del backend `CrearProyectoRequest`.
2. THE Servicio_Proyecto SHALL utilizar el tipo TypeScript `ActualizarProyectoRequest` con los campos `nombre` (string opcional, máximo 200 caracteres), `fechaHabilitacion` (string opcional en formato ISO 8601 `YYYY-MM-DD`), y `estadoHabilitacion` (boolean opcional), alineado con el DTO del backend `ActualizarProyectoRequest`.
3. THE Servicio_Proyecto SHALL utilizar el tipo TypeScript `ProyectoListResponse` con los campos `id` (number), `nombre` (string), `fechaHabilitacion` (string en formato ISO 8601 `YYYY-MM-DD`), y `estadoHabilitacion` (boolean), alineado con el DTO del backend `ProyectoListResponse`.
4. THE ProyectosPage SHALL mostrar las columnas "Nombre", "Fecha de Habilitación" y "Estado" en la tabla de proyectos, donde cada columna corresponde respectivamente a los campos `nombre`, `fechaHabilitacion` y `estadoHabilitacion` del tipo `ProyectoListResponse`.
5. THE Servicio_Proyecto SHALL utilizar la convención camelCase en los nombres de los campos de los tipos TypeScript, correspondiendo a la conversión desde PascalCase de los DTOs del backend (por ejemplo, `FechaHabilitacion` en backend corresponde a `fechaHabilitacion` en frontend).
6. IF el campo `estadoHabilitacion` no se incluye en `CrearProyectoRequest`, THEN THE Servicio_Proyecto SHALL enviar la petición sin dicho campo, delegando al backend la asignación del valor por defecto.

### Requisito 12: Notificaciones de operaciones

**Historia de usuario:** Como usuario, quiero recibir notificaciones visuales cuando una operación se completa con éxito o falla, para tener retroalimentación clara de mis acciones.

#### Criterios de Aceptación

1. WHEN una operación de creación, edición o eliminación se completa exitosamente, THE ProyectosPage SHALL mostrar una Notificación de éxito de color verde en la parte superior de la página, con un mensaje que indique el tipo de operación realizada.
2. WHEN una operación falla por error de red, timeout o respuesta de error del servidor, THE ProyectosPage SHALL mostrar una Notificación de error de color rojo en la parte superior de la página, con un mensaje que indique la naturaleza del fallo.
3. THE Notificación SHALL desaparecer automáticamente después de 4 segundos sin intervención del usuario, y el temporizador de auto-cierre SHALL cancelarse si el usuario cierra la Notificación manualmente antes de que expire.
4. THE Notificación SHALL contener un botón de cierre (icono "×") para que el usuario pueda descartarla antes de que desaparezca automáticamente.
5. THE Notificación SHALL utilizar el atributo role="alert" para que los lectores de pantalla anuncien su contenido automáticamente al aparecer.
6. WHEN se dispara una nueva Notificación mientras otra está visible, THE ProyectosPage SHALL reemplazar la Notificación existente por la nueva y reiniciar el temporizador de 4 segundos.
