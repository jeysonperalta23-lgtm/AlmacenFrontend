# Digitalización

Servicios previstos: `GestionarSesionCaptura`, `RecibirPagina` y `OrdenarPaginas`.
Implementar después de acceso, ubicaciones y expedientes persistentes.

Guardar imágenes en almacenamiento privado del backend y metadatos en MySQL.
Validar contenido, tamaño y tipo de archivo. Las reservas y los identificadores
de captura permiten evitar duplicados ante reintentos.

El receptor actual `api/demo.php` del frontend sigue separado de este módulo.
No moverlo ni sustituirlo hasta que el nuevo flujo esté implementado y probado.
