import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import RegistroFisicoForm from '../../components/inventory/RegistroFisicoForm';
import TablaInventario from '../../components/inventory/TablaInventario';
import { RegistroFisico } from '../../types/inventory';

export default function LevantamientoPage() {
  const [registros, setRegistros] = useState<RegistroFisico[]>([]);

  const handleAddRegistro = (nuevoRegistro: Omit<RegistroFisico, 'id'>) => {
    const registroCompleto: RegistroFisico = {
      ...nuevoRegistro,
      // En una app real usaríamos crypto.randomUUID() o una base de datos
      id: Math.random().toString(36).substring(2, 9),
    };
    
    setRegistros((prev) => [...prev, registroCompleto]);
  };

  const handleDeleteRegistro = (id: string) => {
    setRegistros((prev) => prev.filter(r => r.id !== id));
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Levantamiento Físico</h1>
        <p className="text-slate-500 mt-1">Registra el estado actual ("Foto Real") de los estantes antes de asignar códigos y reubicar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Columna Izquierda: Formulario (Sticky para que baje contigo) */}
        <div className="lg:sticky lg:top-24">
          <RegistroFisicoForm onAddRegistro={handleAddRegistro} />
        </div>

        {/* Columna Derecha: Tabla */}
        <div className="min-h-[500px]">
          <TablaInventario 
            registros={registros} 
            onDeleteRegistro={handleDeleteRegistro} 
          />
        </div>
      </div>
    </Layout>
  );
}
