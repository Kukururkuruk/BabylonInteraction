import React, { useEffect, useRef } from 'react';
import { TotalStationWork } from '../BabylonExamples/TotalStationWork';

const BabylonTotalWork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<TotalStationWork | null>(null); // Ссылка для хранения экземпляра сцены

  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) { // Инициализация сцены только если она еще не создана
      sceneRef.current = new TotalStationWork(canvasRef.current);
    }
  }, []);

  return (
    <div>
      <h3>TotalWork</h3>
      <canvas ref={canvasRef} style={{ width: '95%', height: '95%' }}></canvas>
    </div>
  );
};

export default BabylonTotalWork;
