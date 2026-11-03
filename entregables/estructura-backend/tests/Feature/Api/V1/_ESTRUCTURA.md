# Pruebas HTTP

Crear pruebas al implementar rutas. Primeras comprobaciones:

- Un usuario autorizado crea un estante y lo recupera en una consulta posterior.
- Datos inválidos devuelven 422; códigos duplicados respetan la regla definida.
- Una sesión ausente o un área no autorizada impiden acceder a datos privados.
- Un módulo queda asociado al estante correcto.

Utilizar una base exclusiva de pruebas; nunca reiniciar la base de trabajo.
Todavía no se incluyen pruebas ejecutables de endpoints pendientes.
