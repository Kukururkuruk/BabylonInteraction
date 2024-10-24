import React, { useEffect, useRef } from 'react';
import { BetoneScene } from '../BabylonExamples/BetoneScene';

const BabylonBeton: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new BetoneScene(canvasRef.current); // Передаем функцию открытия модального окна
    }
  }, []);

  return (
    <div>
      <h3>Babylon Distance</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonBeton;