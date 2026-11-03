# Parte 1. Diagnóstico del sistema actual

[Volver al índice](../../ANALISIS_BACKEND.md)

## 1. Alcance y fuentes

Se inspeccionaron configuración, rutas, tipos, servicios en memoria, pantallas principales, formularios, etiquetas, captura móvil, receptor PHP, pruebas existentes y documentación de prácticas. El frontend se encuentra en `C:/xampp/htdocs/ALMACEN`; el backend, en `C:/xampp/htdocs/ALMACEN-BACKEND`.

Las rutas `src/...` citadas a continuación pertenecen a la copia de XAMPP. No se interpretó un plan anterior como prueba de implementación. No se consultaron contraseñas del `.env` ni se modificaron las aplicaciones de XAMPP.

La comparación SHA-256 confirmó igualdad entre ambas copias para `api/demo.php` y `dist/assets/index-DO4qFR7V.js`. Esto vincula esos dos archivos; no demuestra que todas las carpetas sean idénticas ni que el compilado corresponda a cada cambio del código fuente.

## 2. Inventario funcional

| Proceso | Evidencia principal | Situación verificada por lectura |
|---|---|---|
| Navegación | `src/App.tsx` | `/archivo`, `/levantamiento`, login y entrada móvil por `?captura=`; no comprueba sesión |
| Login | `src/pages/Login/LoginPage.tsx` | Envía el formulario a un manejador local que muestra un aviso; no autentica |
| Registro y edición | `src/components/archive/FormExpediente.tsx` | Campos documentales, ubicación, código sugerido, datos especiales de Abastecimiento y folios |
| Catálogo | `src/pages/Archivo/ArchivoCentral.tsx` | Agrega, modifica y elimina objetos en memoria |
| Estructura física | `src/services/archiveMemory.ts`, `ConfigEstantes.tsx` | Estantes y módulos como claves y textos; estructura inicial de demostración |
| Ubicación e historial | `ArchivoCentral.tsx`, `DetalleExpediente.tsx` | Cambio detectado al editar y guardado en un arreglo, con fecha del navegador |
| Búsqueda y mapa | `MapaEstantes.tsx`, `EtiquetadoArchivo.tsx` | Filtran los datos presentes en el navegador |
| Etiquetas | `archiveLabels.ts`, `CodigoEtiqueta.tsx`, `ImprimirEtiquetas.tsx` | QR estable por ID, barras, selección, A4 y térmica |
| Escaneo | `EscanerExpediente.tsx`, `useMobileScanBridge.ts` | El escritorio resuelve la lectura con su catálogo local |
| Digitalización | `Digitalizacion.tsx`, `CapturaMovil.tsx` | Vinculación, confirmación de expediente, reserva, reintento, galería y acciones de estado |
| Receptor | `api/demo.php` | JSON e imágenes en directorio configurable, temporal por defecto; sin base de datos |
| Levantamiento | `LevantamientoPage.tsx`, `RegistroFisicoForm.tsx` | Alta y eliminación local de observaciones físicas |
| Exportación | `TablaInventario.tsx` | Botón Excel sin manejador de descarga |
| Indicadores | `DashboardInicio.tsx` | Cálculos sobre el catálogo recibido y contenido estático |
| Alertas auxiliares | `archiveAlerts.ts`, `RevisionArchivo.tsx` | Tipos y lógica de pendientes; un archivo presente no demuestra un recorrido integrado |

## 3. Backend existente

| Elemento | Evidencia | Conclusión |
|---|---|---|
| Framework | `composer.json`, `composer.lock`, `vendor/` | Proyecto Laravel instalado con Sanctum |
| API propia | `routes/api.php` | `GET /api/v1/estado` ejecuta `SELECT 1` y responde JSON |
| Middleware SPA | `bootstrap/app.php` | `statefulApi()` configurado |
| Usuario | `app/Models/User.php` | Modelo básico, sin roles ni áreas de negocio |
| Migraciones | `database/migrations/` | Usuarios/sesiones, caché, trabajos y tokens; no tablas documentales |
| Datos iniciales | `DatabaseSeeder.php` | Contiene un usuario de ejemplo de factory; no acredita que se haya ejecutado |
| Pruebas | `tests/Feature/ExampleTest.php`, `tests/Unit/ExampleTest.php` | Verifican la portada y una aserción trivial; no cubren negocio |
| Historial de instalación | `INICIO.md` | Registra comprobaciones anteriores de PHP, MySQL y Laravel; no son pruebas ejecutadas en esta revisión |

No hace falta volver a crear Laravel desde cero. Sí hace falta comprobar PHP, MySQL, migraciones y rutas antes de desarrollar sobre esa instalación.

## 4. Hallazgos prioritarios

| Prioridad | Hallazgo | Consecuencia | Solución de backend |
|---|---|---|---|
| P0 | Expedientes y levantamiento en memoria | Al recargar no se recupera el catálogo | Persistir en MySQL y consultar al abrir |
| P0 | Login sin autenticación y rutas libres | Abrir una ruta no exige identidad | Sesiones, middleware y Policies |
| P0 | Varias operaciones del receptor solo exigen conocer el ID de sesión | El ID se usa como capacidad de acceso a fotos y cargas | Credencial móvil limitada, revocable y con vencimiento |
| P1 | Código construido con módulo, tipo, año y tomo | Dos registros pueden compartir código | Separar código único y referencia documental repetible |
| P1 | Se quitan módulos sin comprobar expedientes | Referencias físicas inválidas | Restricción de ubicaciones ocupadas |
| P1 | IDs y fechas creados en React | Falta autoridad central y trazabilidad | Generación del servidor y actor autenticado |
| P1 | Sin control de edición simultánea | Un usuario puede sobrescribir cambios de otro | Campo de versión y conflicto `409` |
| P1 | Orden de fotos modificado en memoria | No hay recuperación persistente del orden | Orden por expediente en MySQL |
| P1 | `estado`, `estadoDigital` y estados auxiliares | Pantallas pueden interpretar distinto el avance | Un único `estado_digital` canónico |
| P1 | El receptor admite finalizar sin verificar páginas | La restricción visual se puede omitir | Reglas de finalización en servidor |
| P1 | Total de inventario suma cajas, tomos y otras unidades | El total puede inducir a error | Subtotales por unidad |
| P2 | Módulo físico y área administrativa mezclados | Un movimiento puede alterar la interpretación de procedencia | IDs separados para ubicación, custodia y origen |
| P2 | Excel sin implementar | No hay salida operativa de inventario | Exportación con filtros y permisos |
| P2 | Formularios limpian antes de una confirmación remota | Al integrar API podrían perderse campos tras un error | Guardado asíncrono y limpieza al confirmar |
| P2 | Copia de Documentos incompleta | No es una base reproducible para desarrollo | Elegir y respaldar una copia completa |

P0 bloquea el uso real; P1 protege consistencia; P2 completa integración y operación. Esta priorización es técnica, no una evaluación institucional.

## 5. Qué conviene conservar

El recorrido de registro continuo, mapa, selección para impresión, QR por identificador y confirmación móvil ya aporta una base útil. El receptor también contiene ideas aprovechables: bloqueo del JSON, revisión del expediente activo y reintento por identificador de captura. Deben trasladarse a transacciones, restricciones y permisos del backend definitivo.

No es necesario reconstruir toda la interfaz. Hay que sustituir sus fuentes de datos y adaptar sus operaciones para esperar respuestas reales.

## 6. Alcance que no debe confundirse

Los préstamos, devoluciones y transferencias se mencionan como actividades posibles del área, pero no se encontraron como módulos implementados. OCR, PDF consolidado, firma digital, publicación pública y operación sin conexión son ampliaciones, no requisitos actuales demostrados.

La nomenclatura institucional, retención y eliminación documental necesitan validación del área; esta guía no establece normas archivísticas ni políticas legales.
