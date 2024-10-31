import React, { useEffect, useRef } from 'react';
import { TotalStation } from '../BabylonExamples/TotalStation';

const BabylonTotal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new TotalStation(canvasRef.current); // Передаем функцию открытия модального окна
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