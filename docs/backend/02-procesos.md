# Parte 2. Procesos del sistema y responsabilidad del backend

[Volver al índice](../../ANALISIS_BACKEND.md)

Los procesos siguientes son la especificación propuesta para transformar el prototipo en un sistema persistente. El encargado trabaja dentro de sus áreas autorizadas; el administrador técnico administra accesos sin recibir automáticamente acceso a todos los documentos.

## P01. Inicio y cierre de sesión

**Entrada:** correo y contraseña. **Actor:** usuario activo.

1. React inicializa CSRF y envía las credenciales.
2. Laravel comprueba contraseña, estado y límite de intentos.
3. Regenera la sesión y devuelve identidad, rol y áreas autorizadas.
4. React consulta al usuario actual al recargar.
5. Al salir, Laravel invalida la sesión y regenera el token CSRF.

**Reglas:** contraseñas con hash; cada persona tiene cuenta propia; ninguna contraseña o token de sesión se guarda en `localStorage`; una ruta visual protegida no sustituye la autorización de la API.

**Salida:** sesión válida o error sin revelar si el correo existe. **Tablas:** `users`, `sessions`, `usuario_area`. **Aceptación:** acceder directamente a expedientes sin autenticación devuelve `401`; después del logout ya no hay acceso.

## P02. Administración de usuarios y ámbitos

**Entrada:** nombre, correo, rol, estado y áreas. **Actor:** administrador técnico.

1. Registrar cuenta y asignar áreas de custodia permitidas.
2. Entregar acceso por un procedimiento controlado, sin contraseña fija en seeders.
3. Actualizar permisos o desactivar cuenta.
4. Invalidar sus sesiones y vinculaciones de captura cuando corresponda.

**Reglas:** el rol técnico y el permiso documental se comprueban por separado; el backend no concede acceso porque el cliente envíe un `area_custodia_id`; impedir dejar el sistema sin administrador activo.

**Salida:** cuenta administrada y evento de auditoría. **Aceptación:** un usuario de otra área no puede consultar ni descargar documentos cambiando IDs en la URL.

## P03. Catálogos documentales

**Entrada:** áreas, tipos documentales y datos institucionales. **Actor:** persona con permiso de configuración.

Registrar códigos y nombres, normalizar espacios, controlar duplicados y permitir desactivación. Los expedientes conservan referencias a catálogos históricos aunque estos dejen de ofrecerse para nuevos registros.

**Reglas:** separar área de origen de área de custodia; no usar nombres de módulos para decidir automáticamente la procedencia. Los valores de institución y jurisdicción se configuran; no se repiten como constantes en cada formulario.

**Salida:** opciones estables para formularios. **Aceptación:** renombrar un área no rompe expedientes; desactivar un tipo impide nuevas altas con ese tipo y permite consultar las anteriores.

## P04. Configuración física

**Entrada:** estante, módulo y nivel. **Actor:** encargado autorizado.

La jerarquía propuesta es `área de custodia → estante → módulo → nivel`. Cada elemento tiene ID propio. Se crean niveles explícitos para representar las bandejas que hoy se escriben como texto.

**Reglas:** código de estante único por custodia; módulo único dentro del estante; nivel único dentro del módulo. No eliminar una ubicación ocupada. Desactivarla conserva referencias y debe mostrarse como inactiva; reubicar contenido es otra operación.

**Salida:** estructura persistente para formulario y mapa. **Aceptación:** crear, recargar y consultar desde otra computadora muestra la misma estructura.

## P05. Registro de expedientes

**Entrada:** custodia, procedencia, tipo, año, tomo, folios, observaciones, referencia documental y nivel físico.

1. Autorizar al usuario en el área de custodia.
2. Validar catálogos, nivel y pertenencia de la ubicación a esa custodia.
3. Validar año y folios; conservar `001` como representación textual.
4. Asignar ID permanente y correlativo de registro dentro de una transacción.
5. Insertar expediente, ubicación inicial, autor y auditoría.
6. Confirmar a React; recién entonces mostrar éxito y limpiar campos.

**Reglas:** el código único lo asigna el servidor; el código histórico puede repetirse como referencia; el año documental y el año del correlativo son conceptos distintos. No confiar en fecha, autor, estado finalizado o contador recibidos del cliente.

**Salida:** expediente con `id`, `codigo`, `version=1` y `estado_digital=SIN_INICIAR`. **Aceptación:** dos registros simultáneos reciben códigos diferentes y sobreviven a una recarga.

## P06. Edición y corrección de datos

**Entrada:** ID, campos modificables y versión conocida. **Actor:** encargado con permiso.

Consultar el registro autorizado, comparar versión, validar cambios y actualizar incrementando la versión. Guardar los cambios relevantes en auditoría. Si otro usuario modificó el registro, responder `409` y mostrar la versión actual para revisión.

**Reglas:** cambiar tipo o tomo no cambia el ID del QR. El código de registro no se regenera automáticamente. Una modificación de ubicación ejecuta el proceso P07 incluso si se inicia desde el formulario de edición.

**Salida:** registro actualizado. **Aceptación:** una edición antigua no sobrescribe silenciosamente otra más reciente.

## P07. Reubicación e historial

**Entrada:** expediente, nivel destino, motivo y versión.

1. Bloquear el expediente y comprobar permisos y versión.
2. Verificar que el destino esté activo y pertenezca a la misma custodia.
3. Registrar origen, destino, descripciones de ese momento, usuario y fecha.
4. Actualizar ubicación y versión en la misma transacción.

**Reglas:** la procedencia documental no cambia al moverlo. Transferir entre áreas de custodia queda fuera de este movimiento simple. Si una operación falla, se revierten tanto la ubicación como el historial.

**Salida:** nueva ubicación trazable. **Aceptación:** el historial sigue siendo comprensible tras renombrar un estante.

## P08. Búsqueda, detalle y mapa

**Entrada:** texto, año, área, tipo, ubicación, estado digital y paginación.

El servidor aplica primero el ámbito autorizado y después los filtros. Devuelve un orden estable, resultados paginados y total del conjunto filtrado. El mapa consulta estructura y cantidades; los expedientes de una ubicación se cargan bajo demanda.

**Reglas:** buscar no depende de haber descargado todo el catálogo. No sumar una página de resultados como si fuera el total del archivo. Una consulta fuera del ámbito no revela datos del expediente.

**Salida:** lista, detalle o mapa coherente. **Aceptación:** encontrar un expediente que no estaba en la página cargada y obtener el mismo resultado en dos equipos.

## P09. Etiquetas y resolución de QR

**Entrada:** IDs seleccionados, formato y número de copias.

La API recupera los IDs autorizados, incluso si se seleccionaron en distintas páginas. React puede conservar la generación de QR, barras y diseño de impresión. El contenido QR sigue siendo `ALMACEN:EXP:<id>`.

**Reglas:** un QR identifica el expediente, no concede permiso de consulta. Reimprimir no crea otro expediente. Un código histórico repetido devuelve candidatos; nunca se elige el primero sin intervención. El código de barras depende de su legibilidad y formato, no sustituye el ID estable.

**Salida:** etiquetas y resolución centralizada. **Aceptación:** escanear un QR impreso antes de reubicar abre el mismo expediente con su ubicación actual.

## P10. Vinculación de celular y sesión de captura

**Entrada:** expediente autorizado y solicitud de vinculación.

1. El encargado abre una sesión y activa el expediente.
2. El servidor genera un código de enlace de un solo uso y corta duración.
3. El celular canjea el código por una cookie de captura limitada.
4. El celular muestra y confirma expediente y revisión activa.
5. Escritorio y celular consultan estado o eventos; el servidor resuelve los códigos escaneados.

**Reglas:** el ID de sesión no es una credencial. Una vinculación no puede administrar usuarios ni descargar todo el archivo. Cerrar, revocar o vencer el vínculo corta las operaciones móviles. La lectura de estado no incrementa la secuencia de cambios.

**Salida:** dispositivo autorizado para esa sesión. **Aceptación:** otro celular que solo conoce el ID no puede cargar ni ver imágenes.

## P11. Reserva y carga de páginas

**Entrada:** identificador de captura, revisión esperada e imagen JPEG, PNG o WebP.

1. Reservar la captura para una sesión, expediente y revisión concretos.
2. Comprobar tamaño, contenido real y dimensiones del archivo.
3. Guardar en almacenamiento temporal privado y calcular checksum.
4. Registrar la operación pendiente con clave de captura única.
5. Mover a ubicación definitiva y confirmar la página y su orden.
6. Notificar el evento para que el escritorio actualice la galería.

**Reglas:** límite inicial propuesto de 12 MB, igual que la demo; límites de dimensiones configurables. Reenviar la misma captura con el mismo contenido devuelve la página existente. Reusar la clave para otro contenido o expediente devuelve conflicto. Una revisión antigua no puede terminar asociada al nuevo expediente activo.

**Salida:** página confirmada una sola vez. **Aceptación:** si la red pierde la respuesta después de guardar, reintentar recupera la página sin duplicarla. Los detalles de recuperación de disco y base de datos están en la parte 5.

## P12. Revisión, orden y estado digital

**Entrada:** páginas, orden solicitado y acción del encargado.

| Estado origen | Acción | Estado destino | Condición |
|---|---|---|---|
| `SIN_INICIAR` | Iniciar | `EN_PROCESO` | Sesión y permiso válidos |
| `EN_PROCESO` | Pausar | `PENDIENTE` | Sin reserva activa sin resolver |
| `PENDIENTE` | Reanudar | `EN_PROCESO` | Permiso y sesión válidos |
| `EN_PROCESO` | Finalizar | `FINALIZADO` | Al menos una página confirmada, sin cargas pendientes y revisión explícita |
| `FINALIZADO` | Reabrir | `EN_PROCESO` | Permiso específico, motivo y auditoría |

Se propone que cerrar o vencer una sesión pause sus trabajos activos, conserve las páginas y revoque sus vínculos. Cambiar de expediente pausa el anterior si estaba en proceso. No hay finalización automática por número de imágenes.

Ordenar valida que todos los IDs pertenezcan al expediente, que no se repitan y que la versión siga vigente. Para modificar o retirar páginas de un expediente finalizado, se exige reapertura. Retirar una página se registra como baja lógica; la purga física es una política posterior.

**Salida:** galería y estado persistentes. **Aceptación:** recargar recupera exactamente el orden confirmado; la última página retirada no deja un expediente finalizado sin contenido.

## P13. Levantamiento físico

**Entrada:** jornada, ubicación observada, procedencia, tipo, año, cantidad, unidad y notas.

Abrir jornada, registrar observaciones, corregirlas mientras esté abierta y cerrar la jornada al terminar. Conservar texto de ubicación observada y permitir referencia opcional a un nivel normalizado. Esto permite registrar lo encontrado antes de ordenar el archivo.

**Reglas:** cantidad entera positiva para las unidades iniciales; unidades permitidas Caja, Tomo, Carpeta y Paquete. “5 cajas” es una observación agregada y no crea cinco expedientes. No editar una jornada cerrada sin reapertura autorizada y motivo.

**Salida:** inventario observado por jornada, responsable y fecha. **Aceptación:** 5 cajas y 3 tomos se reportan por separado, con dos registros de observación.

## P14. Indicadores, alertas y reportes

**Entrada:** ámbito, filtros y periodo.

La API calcula expedientes activos, altas del periodo, distribución por origen, tipo, año y ubicación, páginas confirmadas y avance digital. Genera reportes de expedientes, movimientos, digitalización y levantamiento usando los mismos filtros y autorización de la consulta.

**Reglas:** distinguir cantidad de registros, folios, fotografías y unidades físicas. Mostrar capacidad ocupada solo si existe una capacidad definida con unidad comparable. “Sin imágenes”, “datos incompletos” y “referencias repetidas” son alertas; no certifican revisión ni duplicación real.

**Salida:** panel y archivo exportado. **Aceptación:** exportar todos los resultados filtrados, no solo la página visible, y obtener subtotales equivalentes al reporte.

## P15. Baja lógica y restauración

**Entrada:** expediente, motivo y versión. **Actor:** usuario con permiso específico.

Marcar baja con autor y fecha; excluirlo de las consultas habituales, conservando relaciones. Rechazar baja mientras tenga capturas activas sin resolver. Restaurar verificando ubicación y permisos; si se requiere una nueva ubicación, dejar un movimiento explícito.

**Reglas:** el código no se reutiliza al dar de baja. No trasladar el botón de vaciado de la demo a un borrado general de producción. Baja del registro no implica autorización para destruir documentos físicos.

**Salida:** estado recuperable con trazabilidad. **Aceptación:** restaurar conserva el mismo ID, QR, imágenes e historial.

## P16. Auditoría, respaldo y recuperación

**Entrada:** acciones del sistema y programación de respaldos. **Actores:** aplicación y responsable técnico.

Registrar quién hizo qué, cuándo y sobre qué entidad. Resguardar base de datos, imágenes y configuración necesaria. Restaurar una copia en entorno separado y comprobar relaciones e imágenes antes de declarar la copia utilizable.

**Reglas:** auditoría sin contraseñas, cookies o códigos de vinculación; respaldo de base de datos y archivos coherente; recuperación con responsable y pasos documentados. Frecuencia, retención y tiempo máximo de recuperación se acuerdan con la institución.

**Salida:** trazabilidad y capacidad comprobada de recuperar el servicio. **Aceptación:** un respaldo restaurado permite buscar un expediente y abrir sus imágenes.
