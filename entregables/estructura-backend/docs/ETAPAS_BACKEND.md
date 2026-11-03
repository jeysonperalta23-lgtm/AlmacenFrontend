# Desarrollo por etapas

## Estado comprobado al preparar esta estructura

Existe Laravel en `C:\xampp\htdocs\ALMACEN-BACKEND`, con Sanctum instalado,
un modelo User, migraciones base y `GET /api/v1/estado` que consulta la base.
No se ha verificado aquí que MySQL esté iniciado ni que esa ruta responda por HTTP.
El frontend de Documentos mantiene expedientes en memoria.

## 1. Acceso y contexto

Revisar la configuración existente, identificar institución y área operadora,
implementar inicio de sesión, cierre y consulta de identidad. Aplicar permisos.
Conservar las credenciales del backend fuera del frontend.

## 2. Primer recorrido completo: estructura

Crear modelos, migraciones y validaciones de estantes, módulos y niveles.
Implementar el contrato previsto:

| Método | Ruta | Resultado |
|---|---|---|
| GET | /api/v1/estructura | Estantes, módulos y niveles autorizados |
| POST | /api/v1/estantes | Crear estante |
| POST | /api/v1/estantes/{id}/modulos | Crear módulo |
| POST | /api/v1/modulos/{id}/niveles | Crear nivel |

Estas rutas son pendientes, no servicios disponibles. Conectar después la
pantalla Configurar Estantes de React y comprobar persistencia al recargar.

## 3. Expedientes

Implementar alta, consulta paginada, detalle, edición e historial. Guardar códigos
en el servidor y mantener IDs estables para QR. Conectar registro y exploración.

## 4. Digitalización

Implementar sesiones, vinculación móvil y fotografías privadas. Sustituir el
receptor demo únicamente cuando el flujo completo esté validado.

## 5. Levantamiento y reportes

Agregar jornadas, registros, cierre y consultas según necesidades reales.

Cada entrega incluye migraciones, permisos, validación, pruebas y conexión de
su pantalla. No es necesario implementar todos los controladores de una vez.
