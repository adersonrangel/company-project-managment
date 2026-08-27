# Requirements Document

## Introduction

Esta funcionalidad agrega un sistema de autenticación basado en usuario y contraseña con emisión de tokens JWT para la aplicación CompanyProjectManagement. En el backend (.NET, arquitectura por capas) se expondrá un endpoint de inicio de sesión que valida credenciales y emite un JWT firmado, se protegerán los endpoints mediante autorización y se validarán los tokens en cada solicitud. En el cliente (React + TypeScript) se completará el ciclo de seguridad: almacenamiento y adjunto del token en las solicitudes HTTP, manejo de respuestas no autorizadas y expiración, protección de rutas, cierre de sesión y validación del formulario de inicio de sesión con Zod.

El objetivo es controlar el acceso a los recursos existentes y futuros, garantizando que solo usuarios autenticados con un token válido puedan operar sobre la aplicación.

## Glossary

- **Sistema_Autenticacion**: Conjunto de componentes del backend responsables de validar credenciales, emitir y validar tokens JWT. Incluye el controlador de autenticación y el servicio de autenticación.
- **Servicio_Autenticacion**: Componente de la capa de aplicación del backend que orquesta la verificación de credenciales y la emisión de tokens.
- **Controlador_Autenticacion**: Controlador ASP.NET Core que expone los endpoints de autenticación bajo la ruta `api/auth`.
- **Servicio_Token**: Componente del backend responsable de generar, firmar y establecer la expiración de los tokens JWT.
- **Middleware_Autorizacion**: Componente del backend que valida el token JWT presente en las solicitudes entrantes y determina el acceso a los endpoints protegidos.
- **Almacen_Usuarios**: Repositorio del backend que persiste y recupera las entidades de usuario, incluyendo el hash de la contraseña.
- **Servicio_Contrasena**: Componente del backend responsable de generar el hash de una contraseña y de verificar una contraseña contra un hash almacenado.
- **JWT**: JSON Web Token firmado que representa la identidad autenticada de un usuario y contiene una fecha de expiración.
- **Usuario**: Entidad que posee un nombre de usuario único y un hash de contraseña, y que puede autenticarse en el sistema.
- **Cliente_Web**: Aplicación frontend React + TypeScript que consume la API.
- **Cliente_Http**: Instancia de axios del frontend usada para realizar solicitudes a la API.
- **Interceptor_Solicitud**: Interceptor de axios que adjunta el token a las solicitudes salientes.
- **Interceptor_Respuesta**: Interceptor de axios que procesa respuestas de error, incluyendo respuestas no autorizadas.
- **Almacen_Token_Cliente**: Mecanismo de almacenamiento del token JWT en el navegador del cliente.
- **Guardia_Ruta**: Componente del frontend que restringe el acceso a rutas protegidas según el estado de autenticación.
- **Validador_Login**: Esquema de validación Zod que valida los campos del formulario de inicio de sesión en el cliente.
- **Formulario_Login**: Formulario del cliente que captura nombre de usuario y contraseña.
- **Endpoint_Protegido**: Endpoint de la API que requiere un token JWT válido para ser accedido.

## Requirements

### Requisito 1: Inicio de sesión y emisión de token

**Historia de Usuario:** Como usuario registrado, quiero iniciar sesión con mi nombre de usuario y contraseña, para obtener un token de acceso que me permita usar la aplicación.

#### Criterios de Aceptación

1. THE Controlador_Autenticacion SHALL exponer un endpoint HTTP POST en la ruta `api/auth/login` que reciba un nombre de usuario de entre 1 y 256 caracteres y una contraseña de entre 1 y 256 caracteres.
2. WHEN se recibe una solicitud de inicio de sesión con un nombre de usuario existente y una contraseña cuya verificación contra el hash almacenado es exitosa, THE Sistema_Autenticacion SHALL responder con código HTTP 200 e incluir en el cuerpo de la respuesta un JWT con un período de validez de 3600 segundos a partir de su emisión.
3. IF se recibe una solicitud de inicio de sesión con un nombre de usuario inexistente, THEN THE Sistema_Autenticacion SHALL responder con código HTTP 401.
4. IF se recibe una solicitud de inicio de sesión con una contraseña cuya verificación contra el hash almacenado falla, THEN THE Sistema_Autenticacion SHALL responder con código HTTP 401.
5. IF se recibe una solicitud de inicio de sesión con el nombre de usuario ausente o vacío, con la contraseña ausente o vacía, o con cualquiera de los dos campos con una longitud superior a 256 caracteres, THEN THE Sistema_Autenticacion SHALL responder con código HTTP 400 e incluir un mensaje que identifique cuál de los campos (nombre de usuario o contraseña) no cumple el requisito de entrada.
6. IF el inicio de sesión falla por credenciales inválidas, THEN THE Sistema_Autenticacion SHALL responder con un mensaje que no revele si el fallo se debe al nombre de usuario o a la contraseña.

### Requisito 2: Generación y firma del token JWT

**Historia de Usuario:** Como responsable de seguridad, quiero que los tokens sean firmados y tengan expiración, para garantizar la integridad y limitar la vigencia del acceso.

#### Criterios de Aceptación

1. WHEN el Servicio_Token genera un JWT, THE Servicio_Token SHALL firmar el token con la clave secreta configurada en la aplicación y producir un token con firma verificable mediante esa misma clave.
2. WHEN el Servicio_Token genera un JWT, THE Servicio_Token SHALL incluir en el token una fecha de expiración igual al instante de emisión más 60 minutos, con una tolerancia máxima de 1 segundo respecto al instante de emisión.
3. WHEN el Servicio_Token genera un JWT, THE Servicio_Token SHALL incluir en el token, como claims, un identificador de usuario no vacío y un nombre de usuario no vacío.
4. THE Servicio_Token SHALL obtener la clave secreta de firma, el emisor y la audiencia desde la configuración de la aplicación.
5. IF la clave secreta de firma no está presente en la configuración al iniciar la aplicación, THEN THE Sistema_Autenticacion SHALL impedir el arranque de la aplicación y presentar un mensaje de error que indique la ausencia de la clave secreta de firma.
6. IF el emisor o la audiencia no están presentes en la configuración al iniciar la aplicación, THEN THE Sistema_Autenticacion SHALL impedir el arranque de la aplicación y presentar un mensaje de error que indique el parámetro de configuración ausente.
7. IF el identificador de usuario o el nombre de usuario están vacíos al generar un JWT, THEN THE Servicio_Token SHALL no emitir el token y devolver un error que indique los datos de usuario faltantes.
8. IF la operación de firma del token falla, THEN THE Servicio_Token SHALL no emitir el token y devolver un error que indique el fallo de firma.

### Requisito 3: Validación de token y protección de endpoints

**Historia de Usuario:** Como responsable de seguridad, quiero que los endpoints protegidos requieran un token válido, para controlar el acceso a los recursos.

#### Criterios de Aceptación

1. WHEN se recibe una solicitud a un Endpoint_Protegido con un JWT válido y no expirado en la cabecera `Authorization` con el esquema `Bearer`, THE Middleware_Autorizacion SHALL permitir el procesamiento de la solicitud.
2. IF se recibe una solicitud a un Endpoint_Protegido sin cabecera `Authorization`, THEN THE Middleware_Autorizacion SHALL responder con código HTTP 401 e incluir una indicación de que se requiere autenticación.
3. IF se recibe una solicitud a un Endpoint_Protegido con una cabecera `Authorization` mal formada (sin el esquema `Bearer` o con un token vacío), THEN THE Middleware_Autorizacion SHALL responder con código HTTP 401 e incluir una indicación del motivo.
4. IF se recibe una solicitud a un Endpoint_Protegido con un JWT cuya firma no es válida, THEN THE Middleware_Autorizacion SHALL responder con código HTTP 401 e incluir una indicación del motivo.
5. IF se recibe una solicitud a un Endpoint_Protegido con un JWT cuya fecha de expiración es anterior al instante actual, THEN THE Middleware_Autorizacion SHALL responder con código HTTP 401 e incluir una indicación del motivo.
6. WHERE un endpoint está marcado como público, THE Middleware_Autorizacion SHALL permitir el acceso sin requerir un JWT.
7. THE Sistema_Autenticacion SHALL requerir un JWT válido para acceder a los endpoints de los controladores de Dashboard, Empresa y Proyecto.

### Requisito 4: Sistema básico de usuario y contraseña

**Historia de Usuario:** Como administrador, quiero que las credenciales de los usuarios se almacenen de forma segura, para proteger las contraseñas frente a accesos no autorizados.

#### Criterios de Aceptación

1. THE Almacen_Usuarios SHALL persistir cada Usuario con un nombre de usuario único de entre 3 y 64 caracteres y un hash de contraseña.
2. WHEN se registra la contraseña de un Usuario, THE Servicio_Contrasena SHALL almacenar el hash de la contraseña junto con su sal y descartar la contraseña en texto plano sin persistirla.
3. WHEN el Servicio_Contrasena verifica una contraseña contra un hash almacenado, THE Servicio_Contrasena SHALL devolver un resultado que indique si la contraseña coincide o no coincide con el hash, usando un algoritmo de hash con sal.
4. WHEN el Servicio_Autenticacion solicita un Usuario por su nombre de usuario y el Usuario existe, THE Almacen_Usuarios SHALL recuperar el Usuario correspondiente.
5. WHEN el Servicio_Autenticacion solicita un Usuario por un nombre de usuario que no existe, THE Almacen_Usuarios SHALL indicar que el Usuario no fue encontrado sin crear un nuevo Usuario.
6. IF se intenta persistir un Usuario con un nombre de usuario que ya existe en el Almacen_Usuarios, THEN THE Sistema_Autenticacion SHALL rechazar la operación, preservar el Usuario existente sin modificarlo e informar el conflicto de duplicado.
7. IF se intenta persistir un Usuario con un nombre de usuario vacío o fuera del rango de 3 a 64 caracteres, THEN THE Sistema_Autenticacion SHALL rechazar la operación e informar el error de validación.

### Requisito 5: Almacenamiento y adjunto del token en el cliente

**Historia de Usuario:** Como usuario, quiero que la aplicación recuerde mi sesión y envíe mi token automáticamente, para no tener que autenticarme en cada solicitud.

#### Criterios de Aceptación

1. WHEN el Cliente_Web recibe un JWT tras un inicio de sesión exitoso, THE Almacen_Token_Cliente SHALL guardar el JWT de forma que persista tras una recarga de la página y la reapertura de la pestaña del navegador.
2. IF el Almacen_Token_Cliente no puede guardar el JWT, THEN THE Cliente_Web SHALL descartar el token, mantener al usuario como no autenticado y mostrar un mensaje de error.
3. WHEN el Cliente_Http envía una solicitud a la API y existe un JWT almacenado, THE Interceptor_Solicitud SHALL adjuntar en la cabecera `Authorization` el valor compuesto por el esquema `Bearer`, un espacio y el JWT.
4. WHEN el Cliente_Http envía una solicitud a la API y no existe un JWT almacenado, THE Interceptor_Solicitud SHALL enviar la solicitud sin cabecera `Authorization`.
5. WHEN el usuario cierra sesión, THE Almacen_Token_Cliente SHALL eliminar el JWT almacenado de forma que ninguna solicitud posterior incluya la cabecera `Authorization`.

### Requisito 6: Manejo de respuestas no autorizadas y expiración en el cliente

**Historia de Usuario:** Como usuario, quiero que la aplicación reaccione cuando mi sesión deja de ser válida, para volver a autenticarme sin quedar en un estado inconsistente.

#### Criterios de Aceptación

1. WHEN el Cliente_Http recibe una respuesta con código HTTP 401 desde la API, THE Interceptor_Respuesta SHALL eliminar el JWT almacenado y cualquier dato de sesión asociado en el navegador.
2. WHEN el Cliente_Http recibe una respuesta con código HTTP 401 desde la API, THE Cliente_Web SHALL redirigir al usuario a la ruta de inicio de sesión dentro de 2 segundos.
3. IF la eliminación del JWT almacenado falla tras recibir una respuesta HTTP 401, THEN THE Cliente_Web SHALL mantener al usuario como no autenticado y redirigir a la ruta de inicio de sesión.
4. WHEN el Cliente_Web redirige a la ruta de inicio de sesión tras una respuesta HTTP 401, THE Cliente_Web SHALL descartar el resultado de las solicitudes en curso sin aplicarlas al estado de la aplicación.
5. IF el Cliente_Http recibe múltiples respuestas HTTP 401 en paralelo, THEN THE Cliente_Web SHALL ejecutar la eliminación del token y la redirección una sola vez.

### Requisito 7: Protección de rutas en el cliente

**Historia de Usuario:** Como usuario, quiero que las páginas privadas solo estén disponibles cuando he iniciado sesión, para que la información protegida no se muestre sin autenticación.

#### Criterios de Aceptación

1. WHEN un usuario sin JWT almacenado navega a una ruta protegida, THE Guardia_Ruta SHALL redirigir al usuario a la ruta de inicio de sesión sin renderizar el contenido protegido.
2. WHILE existe un JWT almacenado en el navegador, THE Guardia_Ruta SHALL permitir el acceso a las rutas protegidas.
3. IF un usuario navega a una ruta protegida con un JWT expirado o inválido, THEN THE Guardia_Ruta SHALL eliminar el JWT almacenado y redirigir al usuario a la ruta de inicio de sesión sin renderizar el contenido protegido.
4. THE Cliente_Web SHALL exponer una ruta de inicio de sesión accesible sin autenticación previa.
5. WHEN un usuario con un JWT válido almacenado navega a la ruta de inicio de sesión, THE Cliente_Web SHALL redirigirlo a una ruta protegida por defecto.

### Requisito 8: Validación del formulario de inicio de sesión con Zod

**Historia de Usuario:** Como usuario, quiero recibir retroalimentación inmediata sobre errores en el formulario de inicio de sesión, para corregir mis datos antes de enviarlos.

#### Criterios de Aceptación

1. WHEN el usuario envía el Formulario_Login con el campo de nombre de usuario vacío o compuesto únicamente por espacios en blanco, THE Validador_Login SHALL impedir el envío, conservar los datos ya ingresados y mostrar un mensaje indicando que el nombre de usuario es obligatorio.
2. WHEN el usuario envía el Formulario_Login con el campo de contraseña vacío, THE Validador_Login SHALL impedir el envío, conservar los datos ya ingresados y mostrar un mensaje indicando que la contraseña es obligatoria.
3. WHEN el usuario envía el Formulario_Login con una contraseña de menos de 8 caracteres o de más de 64 caracteres, THE Validador_Login SHALL impedir el envío, conservar los datos ya ingresados y mostrar un mensaje indicando que la contraseña debe tener entre 8 y 64 caracteres.
4. WHEN el usuario envía el Formulario_Login con un nombre de usuario de menos de 3 caracteres o de más de 50 caracteres, THE Validador_Login SHALL impedir el envío, conservar los datos ya ingresados y mostrar un mensaje indicando que el nombre de usuario debe tener entre 3 y 50 caracteres.
5. WHEN el usuario envía el Formulario_Login con el campo de nombre de usuario y el campo de contraseña que cumplen todas las reglas del Validador_Login, THE Cliente_Web SHALL enviar la solicitud de inicio de sesión al endpoint `api/auth/login`.
6. WHILE el usuario edita un campo del Formulario_Login que había fallado una validación previa, THE Validador_Login SHALL revalidar dicho campo y actualizar u ocultar su mensaje de error dentro de 500 milisegundos tras el último cambio.
