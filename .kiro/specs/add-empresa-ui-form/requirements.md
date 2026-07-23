# Requirements Document

## Introduction

Esta funcionalidad agrega un formulario modal en la interfaz de usuario para crear y editar empresas. El formulario se presenta como un diálogo emergente (modal) sobre la página de listado de empresas, evitando la navegación a otra página. Incluye validaciones de campos en el lado del cliente antes de enviar los datos al backend.

## Glossary

- **Modal**: Componente de diálogo emergente que se superpone sobre el contenido de la página y bloquea la interacción con el fondo hasta que se cierra.
- **Formulario_Empresa**: Formulario modal que contiene los campos necesarios para crear o editar una empresa (nombre, dirección, teléfono).
- **Overlay**: Capa semitransparente que cubre el fondo de la página cuando el Modal está activo.
- **Validador_Campos**: Lógica de validación del lado del cliente que verifica los campos del formulario antes del envío.
- **EmpresasPage**: Página principal que muestra el listado de empresas en formato tabla.
- **Servicio_Empresa**: Capa de servicio frontend que comunica con la API backend para operaciones CRUD de empresas.

## Requirements

### Requisito 1: Apertura del modal para crear empresa

**Historia de usuario:** Como usuario, quiero hacer clic en un botón "Agregar Empresa" para abrir un formulario modal, para poder registrar una nueva empresa sin salir de la página de listado.

#### Criterios de Aceptación

1. THE EmpresasPage SHALL mostrar un botón "Agregar Empresa" en la sección superior junto al título de la página.
2. WHEN el usuario hace clic en el botón "Agregar Empresa", THE Formulario_Empresa SHALL abrirse como un Modal centrado en la pantalla con los campos "Nombre", "Dirección" y "Teléfono" vacíos.
3. WHILE el Modal está abierto, THE Overlay SHALL cubrir el fondo de la página con una capa semitransparente y bloquear la interacción con los elementos de la página subyacente.
4. WHILE el Modal está abierto, THE Formulario_Empresa SHALL mostrar el título "Agregar Empresa" en la cabecera del modal.
5. WHILE el Modal está abierto, THE EmpresasPage SHALL ignorar clics en el botón "Agregar Empresa" y no abrir un segundo modal.

### Requisito 2: Apertura del modal para editar empresa

**Historia de usuario:** Como usuario, quiero hacer clic en un botón "Editar" en cada fila de la tabla de empresas, para poder modificar los datos de una empresa existente sin salir de la página de listado.

#### Criterios de Aceptación

1. THE EmpresasPage SHALL mostrar un botón "Editar" en la columna de acciones de cada fila de la tabla.
2. WHEN el usuario hace clic en el botón "Editar" de una empresa, THE Formulario_Empresa SHALL abrirse como un Modal centrado en la pantalla con los campos precargados con los datos actuales de la empresa seleccionada (nombre, dirección y teléfono).
3. WHEN el Modal se abre en modo edición, THE Formulario_Empresa SHALL mostrar el título "Editar Empresa" en la cabecera del modal.
4. IF los datos de la empresa seleccionada no pueden ser cargados en el formulario, THEN THE EmpresasPage SHALL mostrar un mensaje de error indicando que no fue posible abrir el formulario de edición.

### Requisito 3: Estructura del formulario

**Historia de usuario:** Como usuario, quiero ver un formulario claro con los campos nombre, dirección y teléfono, para poder ingresar los datos de la empresa de forma sencilla.

#### Criterios de Aceptación

1. THE Formulario_Empresa SHALL contener un campo de texto para "Nombre" con placeholder "Nombre de la empresa" y una longitud máxima de 100 caracteres.
2. THE Formulario_Empresa SHALL contener un campo de texto para "Dirección" con placeholder "Dirección de la empresa" y una longitud máxima de 200 caracteres.
3. THE Formulario_Empresa SHALL contener un campo de texto para "Teléfono" con placeholder "Teléfono de contacto" y una longitud máxima de 20 caracteres.
4. THE Formulario_Empresa SHALL contener un botón "Guardar" visualmente distinguible del botón "Cancelar" (mayor contraste o color de acento) para enviar el formulario.
5. THE Formulario_Empresa SHALL contener un botón "Cancelar" para cerrar el modal sin guardar cambios.
6. THE Formulario_Empresa SHALL mostrar etiquetas visibles encima de cada campo de entrada, con texto que identifique el campo correspondiente ("Nombre", "Dirección", "Teléfono").
7. THE Formulario_Empresa SHALL presentar los campos en orden vertical: Nombre, Dirección, Teléfono, seguidos de los botones de acción.

### Requisito 4: Validación de campos obligatorios

**Historia de usuario:** Como usuario, quiero recibir mensajes claros cuando no completo los campos obligatorios, para poder corregir los errores antes de enviar el formulario.

#### Criterios de Aceptación

1. WHEN el usuario intenta enviar el formulario con el campo "Nombre" vacío o que contiene solo espacios en blanco, THE Validador_Campos SHALL mostrar el mensaje "El nombre es obligatorio" debajo del campo y aplicar un borde de color de error al campo.
2. WHEN el usuario intenta enviar el formulario con el campo "Dirección" vacío o que contiene solo espacios en blanco, THE Validador_Campos SHALL mostrar el mensaje "La dirección es obligatoria" debajo del campo y aplicar un borde de color de error al campo.
3. WHEN el usuario intenta enviar el formulario con el campo "Teléfono" vacío o que contiene solo espacios en blanco, THE Validador_Campos SHALL mostrar el mensaje "El teléfono es obligatorio" debajo del campo y aplicar un borde de color de error al campo.
4. WHILE existan errores de validación, THE Formulario_Empresa SHALL impedir el envío de datos al Servicio_Empresa y todos los errores se mostrarán simultáneamente.
5. WHEN el usuario modifica el valor de un campo que tenía error de validación, THE Validador_Campos SHALL re-evaluar el campo y ocultar el mensaje de error correspondiente si el nuevo valor es válido.

### Requisito 5: Validación de formato de campos

**Historia de usuario:** Como usuario, quiero que el sistema valide el formato de los datos ingresados, para evitar enviar información incorrecta al servidor.

#### Criterios de Aceptación

1. WHEN el usuario ingresa un nombre con menos de 2 caracteres, THE Validador_Campos SHALL mostrar el mensaje "El nombre debe tener al menos 2 caracteres" debajo del campo "Nombre".
2. WHEN el usuario ingresa un nombre con más de 100 caracteres, THE Validador_Campos SHALL mostrar el mensaje "El nombre no puede exceder 100 caracteres" debajo del campo "Nombre".
3. WHEN el usuario ingresa un teléfono que contiene caracteres no numéricos (excluyendo guiones y espacios), THE Validador_Campos SHALL mostrar el mensaje "El teléfono solo puede contener números, guiones y espacios" debajo del campo "Teléfono".
4. WHEN el usuario ingresa un teléfono con menos de 7 o más de 15 dígitos numéricos, THE Validador_Campos SHALL mostrar el mensaje "El teléfono debe tener entre 7 y 15 dígitos" debajo del campo "Teléfono".
5. WHEN el usuario ingresa una dirección con menos de 5 caracteres o más de 200 caracteres, THE Validador_Campos SHALL mostrar el mensaje "La dirección debe tener entre 5 y 200 caracteres" debajo del campo "Dirección".

### Requisito 6: Envío exitoso del formulario para crear empresa

**Historia de usuario:** Como usuario, quiero que al guardar una nueva empresa el sistema la registre y actualice la tabla, para ver inmediatamente la empresa recién creada.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en "Guardar" con todos los campos válidos en modo creación, THE Servicio_Empresa SHALL enviar una solicitud POST a la API con los campos nombre, dirección y teléfono del formulario.
2. WHEN la API responde exitosamente a la creación, THE EmpresasPage SHALL agregar la nueva empresa al listado de la tabla sin recargar la página completa y THE EmpresasPage SHALL mostrar una notificación de éxito indicando que la empresa fue creada.
3. WHEN la API responde exitosamente a la creación, THE Modal SHALL cerrarse automáticamente.
4. WHILE el Servicio_Empresa está procesando la solicitud de creación, THE Formulario_Empresa SHALL deshabilitar el botón "Guardar" y mostrar un texto o spinner visual de carga dentro o junto al botón.
5. IF el Servicio_Empresa no recibe respuesta de la API dentro de 30 segundos, THEN THE Formulario_Empresa SHALL restaurar el botón "Guardar" a su estado habilitado y mostrar un mensaje de error indicando que la operación no pudo completarse por tiempo de espera.

### Requisito 7: Envío exitoso del formulario para editar empresa

**Historia de usuario:** Como usuario, quiero que al guardar los cambios de una empresa existente el sistema actualice los datos y la tabla, para ver los cambios reflejados inmediatamente.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en "Guardar" con todos los campos válidos en modo edición, THE Servicio_Empresa SHALL enviar una solicitud PUT a la API con el identificador numérico de la empresa y los campos nombre, dirección y teléfono con los valores actualizados del formulario.
2. WHEN la API retorna la entidad empresa actualizada en la respuesta a la solicitud PUT, THE EmpresasPage SHALL reemplazar los datos de la fila cuyo identificador coincide con la empresa editada, mostrando los valores actualizados de nombre, dirección y teléfono sin recargar la página completa.
3. WHEN la API retorna la entidad empresa actualizada en la respuesta a la solicitud PUT, THE Modal SHALL cerrarse automáticamente.
4. WHILE el Servicio_Empresa está procesando la solicitud de actualización, THE Formulario_Empresa SHALL deshabilitar el botón "Guardar" y mostrar un indicador de carga visible al usuario.
5. IF el Servicio_Empresa no recibe respuesta de la API dentro de 30 segundos, THEN THE Formulario_Empresa SHALL rehabilitar el botón "Guardar", ocultar el indicador de carga y mostrar un mensaje de error indicando que la solicitud excedió el tiempo de espera.

### Requisito 8: Manejo de errores del servidor

**Historia de usuario:** Como usuario, quiero ser informado cuando ocurre un error al guardar, para saber que la operación no se completó y poder intentarlo de nuevo.

#### Criterios de Aceptación

1. IF la API devuelve un error con código de estado 500, THEN THE Formulario_Empresa SHALL mostrar el mensaje "Ocurrió un error en el servidor. Intente nuevamente." en la parte superior del formulario con estilo de alerta de error.
2. IF la API devuelve un error, THEN THE Modal SHALL permanecer abierto con todos los datos del formulario intactos para que el usuario pueda corregir los datos o reintentar.
3. IF la API devuelve un error de validación del servidor (código 400), THEN THE Formulario_Empresa SHALL mapear los mensajes de error del servidor a los campos correspondientes y mostrarlos debajo de cada campo afectado.
4. IF la API devuelve un error de conflicto (código 409), THEN THE Formulario_Empresa SHALL mostrar el mensaje "Ya existe una empresa con ese nombre." en la parte superior del formulario.

### Requisito 9: Cierre del modal

**Historia de usuario:** Como usuario, quiero poder cerrar el formulario modal de diferentes maneras, para tener flexibilidad en la interacción con la interfaz.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en el botón "Cancelar", THE Modal SHALL cerrarse, ocultar el Overlay, y no enviar datos al Servicio_Empresa.
2. WHEN el usuario hace clic en el Overlay fuera del modal, THE Modal SHALL cerrarse, ocultar el Overlay, y no enviar datos al Servicio_Empresa.
3. WHEN el usuario presiona la tecla Escape, THE Modal SHALL cerrarse, ocultar el Overlay, y no enviar datos al Servicio_Empresa.
4. WHEN el Modal se cierra sin guardar, THE Formulario_Empresa SHALL descartar los datos ingresados y restablecer el formulario a su estado inicial, de modo que al reabrir el modal en modo creación los campos estén vacíos, o en modo edición contengan los datos originales de la empresa.
5. WHILE el Servicio_Empresa está procesando una solicitud, THE Modal SHALL ignorar los intentos de cierre mediante clic en el Overlay o tecla Escape hasta que la solicitud finalice o falle.
6. WHEN el Modal se cierra, THE EmpresasPage SHALL devolver el foco al elemento que activó la apertura del modal.

### Requisito 10: Accesibilidad del modal

**Historia de usuario:** Como usuario que utiliza tecnologías asistivas, quiero que el formulario modal sea accesible, para poder interactuar con la funcionalidad mediante teclado y lectores de pantalla.

#### Criterios de Aceptación

1. WHEN el Modal se abre, THE Formulario_Empresa SHALL enfocar automáticamente el primer campo del formulario ("Nombre").
2. THE Modal SHALL utilizar el atributo role="dialog" y aria-modal="true" para comunicar su propósito a lectores de pantalla.
3. THE Modal SHALL utilizar aria-labelledby para asociar el título del modal como etiqueta accesible.
4. WHILE el Modal está abierto, THE Modal SHALL restringir la navegación por tabulación a los elementos dentro del modal (focus trap), y al llegar al último elemento enfocable con Tab, el foco deberá volver al primer elemento enfocable del modal.
5. WHEN el Modal se cierra, THE EmpresasPage SHALL restaurar el foco al botón que originó la apertura del modal.
6. WHEN el Validador_Campos muestra errores de validación, THE Modal SHALL anunciar los errores a lectores de pantalla mediante aria-live="polite" o role="alert".
