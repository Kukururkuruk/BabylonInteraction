import React, { useEffect, useRef } from 'react';
import { TotalStationWork } from '../BabylonExamples/TotalStationWork';

const BabylonTotalWork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new TotalStationWork(canvasRef.current); // Передаем функцию открытия модального окна
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