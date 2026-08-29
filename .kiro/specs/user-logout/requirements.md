# Requirements Document

## Introduction

Esta funcionalidad agrega el cierre de sesión iniciado por el usuario ("Cerrar sesión" / LogOut) en la interfaz del `Cliente_Web` de la aplicación CompanyProjectManagement (React 19 + TypeScript + Vite). Se apoya en el sistema de autenticación JWT ya existente (spec `authentication-login-jwt`), que ya provee el `AuthContext` con la operación `logout` (Req 5.5 de la spec de auth), el `Almacen_Token_Cliente` (`tokenStorage`), el `Guardia_Ruta` (`ProtectedRoute`) y el manejo de respuestas HTTP 401 con redirección a `/login`.

El foco de esta spec es exponer un control visible y accesible de cierre de sesión dentro del `Layout` de rutas protegidas, solicitar confirmación antes de cerrar sesión reutilizando el `Dialogo_Confirmacion` existente, invocar la operación `logout` del `AuthContext` al confirmar, redirigir a la ruta de inicio de sesión y garantizar un estado consistente tras el cierre. Esta spec NO redefine el borrado del token ni la protección de rutas ya cubiertos por la spec de autenticación; únicamente los referencia donde corresponde.

## Glossary

Los siguientes términos se reutilizan de la spec `authentication-login-jwt` y conservan su definición:

- **Cliente_Web**: Aplicación frontend React + TypeScript que consume la API.
- **Almacen_Token_Cliente**: Mecanismo de almacenamiento del JWT en el navegador del cliente (`tokenStorage`).
- **Guardia_Ruta**: Componente del frontend (`ProtectedRoute`) que restringe el acceso a rutas protegidas según el estado de autenticación.
- **JWT**: JSON Web Token firmado que representa la identidad autenticada de un usuario.
- **Interceptor_Solicitud**: Interceptor de axios que adjunta el JWT en la cabecera `Authorization` de las solicitudes salientes.

Términos propios de esta spec:

- **Contexto_Autenticacion**: Proveedor de estado de autenticación del `Cliente_Web` (`AuthContext`) que expone `isAuthenticated`, `login` y `logout` a través del hook `useAuth`. La operación `logout` elimina el JWT del `Almacen_Token_Cliente` y marca al usuario como no autenticado.
- **Control_Cierre_Sesion**: Elemento interactivo de la interfaz, ubicado en el `Contenedor_Layout`, que el usuario activa para iniciar el cierre de sesión.
- **Contenedor_Layout**: Estructura visual de las rutas protegidas (`Layout`) compuesta por la barra lateral (sidebar) y la barra superior (topbar).
- **Dialogo_Confirmacion**: Componente reutilizable (`ConfirmDialog`) que solicita al usuario confirmar o cancelar una acción destructiva o sensible.
- **Ruta_Login**: Ruta pública de inicio de sesión del `Cliente_Web`, con valor `/login`.

## Requirements

### Requisito 1: Control de cierre de sesión visible en el Layout

**Historia de Usuario:** Como usuario autenticado, quiero ver un control de "Cerrar sesión" en la interfaz, para poder finalizar mi sesión cuando lo desee.

#### Criterios de Aceptación

1. WHILE el usuario se encuentra en una ruta protegida renderizada dentro del `Contenedor_Layout`, THE `Cliente_Web` SHALL mostrar un `Control_Cierre_Sesion` con la etiqueta de texto visible "Cerrar sesión".
2. WHILE el ancho del viewport es igual o superior a 1024 píxeles, THE `Cliente_Web` SHALL renderizar el `Control_Cierre_Sesion` dentro del `Contenedor_Layout` en el pie de la barra lateral; WHILE el ancho del viewport es igual o inferior a 1023 píxeles, THE `Cliente_Web` SHALL renderizar el `Control_Cierre_Sesion` dentro de la barra superior.
3. WHILE el ancho del viewport es igual o inferior a 1023 píxeles con la barra lateral colapsada u oculta, THE `Cliente_Web` SHALL mantener el `Control_Cierre_Sesion` visible dentro del área del viewport sin requerir desplazamiento horizontal y enfocable mediante navegación por teclado.
4. WHEN el usuario activa el `Control_Cierre_Sesion`, THE `Cliente_Web` SHALL deshabilitar el `Control_Cierre_Sesion` y mostrar un indicador de progreso de cierre de sesión.
5. IF el usuario activa el `Control_Cierre_Sesion` mientras un cierre de sesión ya se encuentra en progreso, THEN THE `Cliente_Web` SHALL ignorar la activación adicional sin iniciar un nuevo proceso de cierre de sesión.

### Requisito 2: Confirmación previa al cierre de sesión

**Historia de Usuario:** Como usuario, quiero confirmar antes de cerrar sesión, para evitar cerrar la sesión de forma accidental.

#### Criterios de Aceptación

1. WHEN el usuario activa el `Control_Cierre_Sesion`, THE `Cliente_Web` SHALL mostrar el `Dialogo_Confirmacion` con un mensaje que solicite confirmar el cierre de sesión y con opciones de confirmar y cancelar, dentro de 200 milisegundos tras la activación.
2. WHILE ya existe un `Dialogo_Confirmacion` de cierre de sesión abierto, THE `Cliente_Web` SHALL abstenerse de mostrar una segunda instancia del `Dialogo_Confirmacion`.
3. WHEN el usuario selecciona la opción de cancelar en el `Dialogo_Confirmacion`, THE `Cliente_Web` SHALL cerrar el `Dialogo_Confirmacion`, conservar la sesión activa y mantener al usuario en la ruta actual.
4. WHEN el usuario cierra el `Dialogo_Confirmacion` mediante la tecla Escape o activando el área externa al diálogo, THE `Cliente_Web` SHALL tratar la acción como una cancelación, conservando la sesión activa y manteniendo al usuario en la ruta actual.
5. WHILE el `Dialogo_Confirmacion` de cierre de sesión está abierto, THE `Cliente_Web` SHALL abstenerse de eliminar el JWT del `Almacen_Token_Cliente`.

### Requisito 3: Ejecución del cierre de sesión tras la confirmación

**Historia de Usuario:** Como usuario, quiero que al confirmar el cierre de sesión mi token se elimine y se me lleve al inicio de sesión, para terminar mi sesión de forma segura.

#### Criterios de Aceptación

1. WHEN el usuario selecciona la opción de confirmar en el `Dialogo_Confirmacion` de cierre de sesión, THE `Cliente_Web` SHALL invocar la operación `logout` del `Contexto_Autenticacion`.
2. WHEN la operación `logout` del `Contexto_Autenticacion` finaliza correctamente, THE `Cliente_Web` SHALL redirigir al usuario a la `Ruta_Login`.
3. WHEN el usuario confirma el cierre de sesión, THE `Cliente_Web` SHALL cerrar el `Dialogo_Confirmacion` antes de redirigir al usuario a la `Ruta_Login`.
4. IF la operación `logout` del `Contexto_Autenticacion` falla o no finaliza en un máximo de 5 segundos, THEN THE `Cliente_Web` SHALL mantener al usuario en la ruta actual, cerrar el `Dialogo_Confirmacion` y mostrar un mensaje de error que indique que el cierre de sesión no se completó.

### Requisito 4: Estado consistente tras el cierre de sesión

**Historia de Usuario:** Como usuario, quiero que tras cerrar sesión la aplicación no conserve datos de mi sesión, para que ningún recurso protegido quede accesible.

#### Criterios de Aceptación

1. WHEN el cierre de sesión se completa, THE `Cliente_Web` SHALL eliminar el JWT del `Almacen_Token_Cliente` y restablecer el estado de autenticación en memoria del `Contexto_Autenticacion` a no autenticado.
2. WHEN el cierre de sesión se completa, THE `Interceptor_Solicitud` SHALL enviar las solicitudes posteriores sin la cabecera `Authorization`, conforme al comportamiento definido en la spec `authentication-login-jwt`.
3. WHEN el usuario navega a una ruta protegida después de completar el cierre de sesión, THE `Guardia_Ruta` SHALL redirigir al usuario a la `Ruta_Login` sin renderizar el contenido protegido, conforme al comportamiento definido en la spec `authentication-login-jwt`.
4. IF la operación `logout` del `Contexto_Autenticacion` falla al eliminar el JWT, THEN THE `Cliente_Web` SHALL mantener al usuario como no autenticado, ignorar cualquier JWT residual y redirigir a la `Ruta_Login`.

### Requisito 5: Accesibilidad del control de cierre de sesión

**Historia de Usuario:** Como usuario que navega con teclado o tecnología de asistencia, quiero operar el control de cierre de sesión, para cerrar mi sesión sin depender del ratón.

#### Criterios de Aceptación

1. THE `Control_Cierre_Sesion` SHALL exponer un nombre accesible no vacío que identifique la acción de cerrar sesión.
2. WHEN el usuario desplaza el foco mediante el teclado hasta el `Control_Cierre_Sesion`, THE `Cliente_Web` SHALL mostrar un indicador de foco visible en el `Control_Cierre_Sesion` con una relación de contraste de al menos 3:1 respecto a su entorno.
3. WHEN el `Control_Cierre_Sesion` tiene el foco y el usuario presiona la tecla Enter o la tecla Espacio, THE `Cliente_Web` SHALL activar el `Control_Cierre_Sesion` mostrando el `Dialogo_Confirmacion` dentro de 200 milisegundos.
4. WHEN el `Dialogo_Confirmacion` de cierre de sesión se muestra, THE `Cliente_Web` SHALL trasladar el foco del teclado al primer elemento interactivo del `Dialogo_Confirmacion` dentro de 200 milisegundos.
5. WHILE el `Dialogo_Confirmacion` de cierre de sesión está abierto, THE `Cliente_Web` SHALL confinar el foco del teclado dentro del `Dialogo_Confirmacion`, de modo que la tabulación desde el último elemento interactivo regrese al primero y viceversa.
6. WHEN el usuario cierra el `Dialogo_Confirmacion` mediante la tecla Escape, THE `Cliente_Web` SHALL cancelar el cierre de sesión y devolver el foco del teclado al `Control_Cierre_Sesion` dentro de 200 milisegundos.
