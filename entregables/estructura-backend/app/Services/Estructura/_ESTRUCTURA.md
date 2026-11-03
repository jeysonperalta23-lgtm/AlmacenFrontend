# Estantes, módulos y niveles

Primer módulo de negocio. Servicios previstos: `CrearEstante`, `CrearModulo`
y `CrearNivel`. Coordinar validación del ámbito, unicidad y persistencia.

Un estante pertenece a un área de custodia, un módulo a un estante y un nivel
a un módulo. No cambiar el padre de ubicaciones utilizadas sin una operación
controlada. Preferir desactivación cuando existan expedientes relacionados.
