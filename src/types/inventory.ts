export type UnidadMedida = 'Caja' | 'Tomo' | 'Carpeta' | 'Paquete';

export interface RegistroFisico {
  id: string;               // Identificador único (UUID)
  estante: number;          // Ej: 1, 2, 3
  modulo: string;           // Ej: "A", "B", "1", "2"
  area: string;             // Ej: "Abastecimiento", "Secretaría"
  tipoDocumento: string;    // Ej: "Facturas", "Resoluciones"
  anio: number;             // Ej: 2023
  cantidad: number;         // Ej: 5
  unidad: UnidadMedida;     // Ej: "Caja"
  notasAdicionales?: string; // Observaciones opcionales
}
