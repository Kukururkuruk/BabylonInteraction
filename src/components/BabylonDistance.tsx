import React, { useEffect, useRef } from 'react';
import { DistanceScene } from '../BabylonExamples/DistanceScene';

const BabylonDistance: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new DistanceScene(canvasRef.current); // Передаем функцию открытия модального окна
    }
  }, []);

  return (
    <div>
      <h3>Babylon Distance</h3>
      <canvas ref={canvasRef} style={{ width: '90%', height: '90%' }}></canvas>
    </div>
  );
};

export default BabylonDistance;