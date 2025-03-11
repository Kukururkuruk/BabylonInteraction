import React, { useEffect, useRef } from 'react';
import { TotalStation } from '../BabylonExamples/TotalStation';

const BabylonTotal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<TotalStation | null>(null); // Ссылка для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) { // Инициализация сцены только если она еще не создана
      sceneRef.current = new TotalStation(canvasRef.current);
    }
  }, []);

  return (
    <div>
      <h3>Babylon Total</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonTotal;
