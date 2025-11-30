# Fix and validate user auth flows

## Resumen
- Se agregó una pantalla dedicada para manejar enlaces de Firebase (verificación de email y restablecimiento de contraseña) con feedback claro y sin recargar la página.
- Se extendió el módulo de autenticación para procesar códigos de acción (verificación y reseteo), incluyendo validación y manejo de errores normalizados.
- Se ajustó el proceso de build para servir el nuevo controlador sin romper la estructura existente.

## Archivos clave
- `src/auth-action.html`: nueva vista que procesa enlaces de verificación y restablecimiento de contraseña usando el estilo actual.
- `src/auth-action-controller.js`: controlador que evita recargas, valida formularios, confirma códigos y redirige tras el éxito o muestra errores amigables.
- `src/auth-esm.js`: expone helpers para verificar emails con código, obtener info de códigos de acción y confirmar reseteos de contraseña.
- `build.js`: incluye el nuevo controlador como módulo passthrough para el build.

## Notas y comportamiento esperado
- Enlaces de verificación (`mode=verifyEmail`) muestran un estado de carga, confirman el código y redirigen al login tras informar el éxito; los errores se muestran en el mismo contenedor de mensajes.
- Enlaces de restablecimiento (`mode=resetPassword`) validan el código antes de mostrar el formulario. Las contraseñas deben tener al menos 6 caracteres y coincidir; los mensajes de error/success se muestran inline y no se recarga la página.
- Todos los mensajes usan las clases existentes (`auth-message`, `field-error`, `input-error`) para mantener la estética actual.
