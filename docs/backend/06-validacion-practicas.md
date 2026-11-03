# Parte 6. Validación, despliegue y evidencias para prácticas

[Volver al índice](../../ANALISIS_BACKEND.md)

## 1. Comprobaciones realizadas en esta revisión

| Comprobación | Resultado | Alcance |
|---|---|---|
| Inventario de ambas copias y backend | Completado | La copia de XAMPP contiene las fuentes ausentes en Documentos |
| Comparación SHA-256 | Coinciden receptor PHP y bundle principal comparados | No equivale a comparar todos los archivos |
| TypeScript con `--noEmit --incremental false` sobre el frontend de XAMPP | Sin diagnósticos | Comprobación de tipos; no compilación Vite ni ejecución de UI |
| `php -l api/demo.php` | Sin errores de sintaxis | No verifica autorización ni comportamiento de cargas |
| Script existente `test-archive-alerts.mjs` | Aprobado | Pendientes, duplicados, vigencia de avisos y estados auxiliares |
| Lectura de rutas y migraciones Laravel | Completada | API propia de estado y tablas técnicas; negocio pendiente |
| Flujo real con MySQL, navegador y celular | No ejecutado | Pendiente para la implementación |
| Pruebas de negocio Laravel y restauración | No ejecutadas | Los módulos todavía no existen |

No se ejecutó el build desde Documentos porque esa copia no contiene `src/`. Las pruebas Playwright encontradas incluyen expectativas de reinicio en memoria; deben modificarse cuando se integre persistencia. No se deben presentar como pruebas del backend nuevo.

## 2. Matriz de aceptación

| ID | Proceso | Caso | Resultado esperado |
|---|---|---|---|
| T01 | P01 | Abrir API sin login | `401`, sin contenido documental |
| T02 | P01 | Contraseña incorrecta y múltiples intentos | Rechazo y limitación controlada |
| T03 | P01 | Login, recarga y logout | Sesión recuperable; invalidada al salir |
| T04 | P02 | Cambiar ID de área o de imagen | No consultar fuera del ámbito autorizado |
| T05 | P02 | Desactivar usuario vinculado a un móvil | Se corta sesión y capacidad móvil |
| T06 | P03/P04 | Desactivar catálogo usado | Históricos consultables; nuevas altas restringidas |
| T07 | P04 | Quitar ubicación ocupada | Rechazo o desactivación controlada sin huérfanos |
| T08 | P05 | Alta válida y recarga desde otro equipo | Mismo ID y contenido |
| T09 | P05 | Dos altas concurrentes en mismo periodo | Códigos distintos y correlativo consistente |
| T10 | P05 | Reenviar alta con misma clave y mismo cuerpo | Un solo expediente |
| T11 | P05 | Folios `001` a `125`, rango invertido y extremo incompleto | Conserva ceros; rechaza rangos inválidos |
| T12 | P06 | Dos ediciones con versión inicial idéntica | Una confirma; la antigua recibe conflicto |
| T13 | P07 | Fallo al crear movimiento | Ubicación e historial se revierten juntos |
| T14 | P08/P09 | Resolver QR de expediente fuera de página cargada | Lo encuentra en el catálogo autorizado |
| T15 | P09 | Código de referencia repetido | Devuelve candidatos; no selección arbitraria |
| T16 | P09 | Etiqueta impresa antes de reubicar | Resuelve mismo ID y nueva ubicación |
| T17 | P10 | Reusar enlace consumido o vencido | No crea una segunda vinculación |
| T18 | P10 | Conocer solo ID de sesión | No permite leer/cargar contenido |
| T19 | P11 | Perder respuesta tras confirmar imagen y reenviar | Una sola página con mismo ID |
| T20 | P11 | Misma captura, contenido diferente | `409`, sin sobrescritura |
| T21 | P11 | Captura con revisión antigua | Rechazo; no termina en otro expediente |
| T22 | P11 | Archivo falso, enorme o dimensiones excesivas | Rechazo sin publicación ni página confirmada |
| T23 | P11 | Caída entre archivo temporal, movimiento y confirmación | Reconciliación sin página disponible rota |
| T24 | P12 | Finalizar sin páginas o con reserva pendiente | Rechazo en API, no solo en botón |
| T25 | P12 | Reordenamiento concurrente y recarga | Orden consistente o conflicto visible |
| T26 | P12 | Retirar página de expediente finalizado | Exige reapertura y motivo |
| T27 | P13 | Jornada cerrada y registro nuevo | Rechazo hasta reapertura autorizada |
| T28 | P13/P14 | 5 cajas y 3 tomos | Dos subtotales con unidades distintas |
| T29 | P14 | Exportación filtrada con varias páginas | Exporta conjunto completo autorizado |
| T30 | P15 | Baja y restauración | Conserva ID, código, historial e imágenes |
| T31 | P16 | Auditoría de edición y vinculación | Actor y fecha presentes, secretos ausentes |
| T32 | P16 | Restaurar respaldo completo | Buscar expediente y abrir sus imágenes |

## 3. Estrategia de pruebas

Pruebas de integración Laravel para validación, autorización, transacciones, estados y respuestas HTTP. Usar MySQL de pruebas separado para correlativos, bloqueos, unicidad y carreras; SQLite no demuestra el comportamiento concurrente de MySQL. Un test con dos operaciones secuenciales no sustituye dos transacciones realmente concurrentes.

Playwright cubre login → alta → recarga → búsqueda → movimiento → etiqueta → captura → revisión. Añadir un segundo contexto de usuario y probar el celular real con HTTPS. Los directorios de imágenes y credenciales de pruebas deben estar separados de los municipales.

Reutilizar las pruebas de etiquetas, formulario, mapa y alertas que siguen siendo pertinentes. Cambiar las que esperan pérdida de estado. Mantener pruebas específicas del receptor solo mientras se use la demo; aprobarlas no demuestra que Laravel reciba correctamente las imágenes.

## 4. Criterios operativos

- **Persistencia:** los registros sobreviven recarga y reinicio del servicio con los mismos IDs.
- **Autorización:** consultas, agregados, archivos, exportaciones y móvil respetan la custodia.
- **Consistencia:** una operación concurrente no duplica ni sobrescribe sin avisar.
- **Recuperación:** una copia restaurada incluye base de datos y archivos relacionados.
- **Uso:** el encargado puede completar los recorridos con documentos de prueba representativos.
- **Rendimiento:** medir búsqueda, panel, carga y exportación sobre un volumen definido. No afirmar capacidad de miles de usuarios sin prueba.

Como objetivos iniciales sujetos a validación, se pueden medir tiempos de búsqueda en LAN, tasa de cargas fallidas y tiempo de recuperación de respaldo. Registrar equipo, volumen, fecha y método; acordar los umbrales antes de usarlos como criterio de aceptación.

## 5. Despliegue interno

Proponer un nombre estable y HTTPS confiable desde computadora y celular. Verificar que ambos dispositivos acceden al servidor y que la red inalámbrica no los aísla. El frontend compilado y Laravel deben resolver correctamente `/archivo`, `/levantamiento`, `/api/v1` y `/sanctum`.

La app compara rutas absolutas en `App.tsx`; si se publica bajo `/ALMACEN/`, adaptar base de Vite, rutas y URLs de API. El servidor debe devolver la página React para rutas del frontend sin absorber las solicitudes `/api`. Publicar Laravel mediante `public/`, no exponiendo la raíz, `.env`, `vendor` ni almacenamiento privado.

Para servicio real, usar configuración de producción, depuración desactivada, usuario de base de datos con permisos limitados y procesos supervisados. Si se incorporan colas o tareas programadas, documentar cómo arrancan y se recuperan en el sistema operativo elegido. Vite y `artisan serve` sirven para desarrollo; el despliegue municipal requiere su configuración propia.

La página HTML actual carga fuentes externas; si se exige funcionamiento sin Internet, preparar fuentes locales o alternativas del sistema y verificar el recorrido desconectado de Internet pero conectado a la LAN.

## 6. Respaldo y restauración

Definir responsable, frecuencia, retención, ubicación de copias y acceso. Resguardar MySQL y archivos privados con un punto de corte coherente. Para una primera operación pequeña puede programarse una ventana que pause nuevas escrituras, deje terminar las cargas y tome la copia completa; con mayor volumen, diseñar snapshots o respaldos coordinados.

Guardar un manifiesto con fecha, versión de aplicación, migraciones y conteos/checksums necesarios. Separar la copia del disco que aloja el sistema. No almacenar contraseñas dentro del repositorio ni enviar respaldos por canales improvisados.

Restaurar en un entorno aislado, aplicar la configuración correspondiente y verificar muestra de expedientes, relaciones, páginas, orden y acceso. Registrar tiempo real de restauración y resultado. Una tarea que genera un archivo de respaldo sin abrirlo posteriormente no demuestra recuperabilidad.

## 7. Plan de prácticas vinculado al trabajo técnico

El archivo `planPracticas.md` ya propone 12 semanas y cuatro sprints de dos semanas entre las semanas 3 y 10. La siguiente distribución es una propuesta de alineación; no acredita horas realizadas ni garantiza que todo el alcance quepa sin ajustes.

| Periodo | Trabajo | Evidencia |
|---|---|---|
| Semanas 1–2 | Diagnóstico, entrevista, reglas, mapa de procesos, datos y backlog | Acta de alcance, requerimientos y diseño |
| Sprint 1, semanas 3–4 | Entorno existente, acceso, usuarios, áreas y estructura | Migraciones, login y pruebas de permisos |
| Sprint 2, semanas 5–6 | Expedientes, códigos, movimientos, búsqueda y QR | Demostración persistente entre dos equipos |
| Sprint 3, semanas 7–8 | Digitalización, reintentos, orden y estados | Pruebas móvil/escritorio e integridad de imágenes |
| Sprint 4, semanas 9–10 | Levantamiento, exportación, reportes e integración | Reportes conciliados y casos de aceptación |
| Semanas 11–12 | Despliegue, correcciones, restauración, capacitación e informe | Manuales, evidencia de pruebas y acta de entrega |

Si el entorno o la digitalización consume más tiempo, priorizar la primera entrega funcional y registrar el alcance pendiente con el supervisor. No declarar terminados procesos que solo están diseñados.

## 8. Entregables académicos y técnicos

1. Diagnóstico con evidencias del sistema existente y problemas priorizados.
2. Requerimientos y procesos P01–P16 con actores y criterios de aceptación.
3. Modelo de datos, diccionario y migraciones.
4. Código backend, integración frontend y documentación OpenAPI.
5. Matriz de pruebas con resultado, evidencia e incidencias.
6. Manual técnico: instalación, configuración, servicios, respaldo y restauración.
7. Manual de usuario: acceso, expedientes, movimiento, etiqueta, captura y reportes.
8. Registro de capacitación, observaciones del encargado y acta de entrega.

Objetivo general sugerido: “Implementar e integrar un backend para el sistema web de archivo documental municipal que permita almacenar, consultar y controlar expedientes, ubicaciones y digitalizaciones de forma persistente y con acceso autorizado”.

Objetivos específicos: establecer autenticación y ámbitos; normalizar información; registrar movimientos; vincular imágenes de forma segura y recuperable; generar reportes; verificar el funcionamiento con pruebas y capacitación.

Para medir el aporte, registrar antes y después el tiempo de localizar una muestra equivalente de expedientes, proporción de registros con ubicación completa, cargas confirmadas y éxito de recuperación. No inventar porcentajes de mejora: presentar mediciones reales con tamaño de muestra y condiciones.

## 9. Definiciones institucionales pendientes

| Tema | Propuesta para desarrollar | Qué confirmar |
|---|---|---|
| Área operadora | Custodia separada del origen | Archivo Central o archivo de Abastecimiento |
| Identificación | ID permanente + código correlativo + referencia | Prefijo y ámbito del correlativo |
| Año documental | Configurable | Si realmente corresponde el mínimo actual 1980 |
| Folios | Texto numérico, extremos completos | Anexos, faltantes y rangos especiales |
| Permisos | Administrador y encargado con ámbitos | Baja, restauración, reapertura y configuración |
| Finalización digital | Revisión explícita con al menos una página | Excepciones y responsable de revisión |
| Equipos y volumen | Servidor interno, disco privado y LAN | Disponibilidad, cantidades y usuarios simultáneos |
| Continuidad | Copia de BD + imágenes y restauración probada | Frecuencia, retención y tiempos tolerables |

Estas decisiones ajustan el diseño. No impiden comprender ni preparar los módulos, pero deben cerrarse antes de usar reglas definitivas con documentación real.
