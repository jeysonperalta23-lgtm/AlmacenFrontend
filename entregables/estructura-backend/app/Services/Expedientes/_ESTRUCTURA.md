# Expedientes

Servicios previstos: `RegistrarExpediente`, `AsignarCorrelativo` y
`ReubicarExpediente`. Registrar expediente, código e historial en una transacción.

El servidor genera el ID y el código definitivo. No usar cantidad de registros
más uno para el correlativo. Las reubicaciones conservan origen, destino, actor
y motivo. Implementar idempotencia y control de versión según el plan existente.
