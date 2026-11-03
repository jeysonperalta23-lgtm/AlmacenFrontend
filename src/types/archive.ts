// Tipos para el módulo Archivo Central

export type EstadoDigital = 'EN_PROCESO' | 'PENDIENTE' | 'FINALIZADO'

export interface UbicacionArchivo {
  estante: string
  modulo: string
  nivel: string
}

export interface MovimientoArchivo {
  fecha: string
  anterior?: UbicacionArchivo
  nueva: UbicacionArchivo
}

export interface Expediente {
  id: string
  codigo: string
  estante: string
  modulo: string
  nivel: string
  tipo: string
  anio: string
  tomo: string
  obs: string
  entidad?: string
  area?: string
  jurisdiccion?: string
  folioDesde?: string
  folioHasta?: string
  historialUbicacion?: MovimientoArchivo[]
  fecha?: string
  estadoDigital?: EstadoDigital
  estado?: EstadoDigital
  paginas_capturadas?: number
  id_sesion?: string
}

/** Un mapa de estante (clave '1'|'2'|'3') a lista de módulos */
export type Estructura = Record<string, string[]>

export type BadgeCls = 'ok' | 'warn' | 'due'

export interface BadgeInfo {
  cls: BadgeCls
  txt: string
}
