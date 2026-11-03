# Migraciones de negocio

Conservar las migraciones existentes. Crear migraciones nuevas por entrega:

1. Instituciones, áreas y asignaciones de usuario.
2. Estantes, módulos, niveles y tipos documentales.
3. Expedientes, correlativos, movimientos, auditoría e idempotencia.
4. Sesiones, vinculaciones, reservas, páginas y eventos de captura.
5. Jornadas y registros de levantamiento.

Este paquete no incluye migraciones ejecutables: los campos y relaciones deben
implementarse con el contrato de cada entrega. No ejecutar `migrate:fresh` sobre
la base existente. Probar migraciones y restricciones en una base de pruebas.
