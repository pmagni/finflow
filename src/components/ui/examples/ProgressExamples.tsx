import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

const ProgressExamples = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simular progreso en tiempo real para el ejemplo de carga
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev + 5;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [loadingProgress]);

  return (
    <div className="space-y-6 p-6 bg-gray-950 rounded-xl">
      <h2 className="text-xl font-[650] mb-4">Componente Progress - Ejemplos</h2>

      {/* Variantes básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Variantes básicas</h3>

        <div className="space-y-2">
          <Label>Default (75%)</Label>
          <Progress value={75} className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Success (60%)</Label>
          <Progress value={60} variant="success" className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Warning (45%)</Label>
          <Progress value={45} variant="warning" className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Danger (30%)</Label>
          <Progress value={30} variant="danger" className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Loading ({loadingProgress}%)</Label>
          <Progress value={loadingProgress} variant="loading" className="mb-4" />
        </div>
      </div>

      {/* Tamaños */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tamaños</h3>

        <div className="space-y-2">
          <Label>Extra pequeño (h-1)</Label>
          <Progress value={65} className="h-1 mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Pequeño (h-2)</Label>
          <Progress value={65} className="h-2 mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Predeterminado (h-4)</Label>
          <Progress value={65} className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Grande (h-6)</Label>
          <Progress value={65} className="h-6 mb-4" />
        </div>
      </div>

      {/* Marcadores */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Con marcadores</h3>

        <div className="space-y-2">
          <Label>Etapas de un proceso (25%, 50%, 75%)</Label>
          <Progress value={65} markers={[25, 50, 75]} className="h-5 mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Objetivos (33%, 66%, 100%)</Label>
          <Progress value={45} variant="success" markers={[33, 66, 100]} className="h-5 mb-4" />
        </div>
      </div>

      {/* Animaciones */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Con animaciones</h3>

        <div className="space-y-2">
          <Label>Animación de entrada (50%)</Label>
          <Progress value={50} animate={true} className="mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Animación de entrada con marcadores (30%)</Label>
          <Progress value={30} animate={true} markers={[20, 40, 60, 80]} variant="warning" className="h-4 mb-4" />
        </div>

        <div className="space-y-2">
          <Label>Animación de carga continua</Label>
          <Progress value={loadingProgress} animate={true} variant="loading" className="mb-4" />
        </div>
      </div>
    </div>
  );
};

export default ProgressExamples; 