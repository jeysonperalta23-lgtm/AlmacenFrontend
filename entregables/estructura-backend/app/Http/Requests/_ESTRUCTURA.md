# Validación de entrada

Crear un Form Request por operación: `StoreEstanteRequest`, `StoreModuloRequest`,
`StoreExpedienteRequest`, `MoveExpedienteRequest` y `UploadPaginaRequest`.

Validar una lista explícita de campos permitidos. Usuario, fechas, identificadores,
correlativos y estados internos los asigna el servidor. Comprobar autorización
mediante Policies y devolver los errores de validación asociados a cada campo.
